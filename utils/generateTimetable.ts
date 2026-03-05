import { prisma } from "@/lib/prisma"

type Day = "MON" | "TUE" | "WED" | "THU" | "FRI"
type Slot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface ScheduleEntry {
  gradeId: string
  classroomId: string
  teacherId: string
  subjectId: string
  day: Day
  slot: Slot
}

interface Constraint {
  teacherId: string
  day: Day
  slot: Slot
}

interface ClassroomConstraint {
  classroomId: string
  day: Day
  slot: Slot
}

export async function generateTimetable() {
  // Ensure prisma is initialized
  if (!prisma) {
    throw new Error("Prisma client is not initialized")
  }

  // Clear existing schedule
  await prisma.schedule.deleteMany({})

  // Get all data - including newly added assignments
  const classSubjects = await prisma.classSubject.findMany({
    include: {
      grade: true,
      subject: true,
      teacher: true,
    },
    orderBy: {
      createdAt: "asc", // Process in order they were created
    },
  })

  // Log for debugging - show all teachers and their assignments
  console.log(`Generating timetable for ${classSubjects.length} assignments:`)
  const teachersInAssignments = new Set(classSubjects.map(cs => cs.teacherId))
  console.log(`Total unique teachers with assignments: ${teachersInAssignments.size}`)
  classSubjects.forEach((cs) => {
    console.log(`- ${cs.grade.name} - ${cs.subject.name} (Teacher: ${cs.teacher.name}, ID: ${cs.teacherId}) - ${cs.subject.hoursPerWeek} hours/week`)
  })
  
  // Warn if there are teachers without assignments
  const allTeachers = await prisma.teacher.findMany()
  const teachersWithoutAssignments = allTeachers.filter(t => !teachersInAssignments.has(t.id))
  if (teachersWithoutAssignments.length > 0) {
    console.warn(`⚠️ Warning: ${teachersWithoutAssignments.length} teacher(s) have no assignments and will not appear in the schedule:`)
    teachersWithoutAssignments.forEach(t => {
      console.warn(`  - ${t.name} (ID: ${t.id})`)
    })
  }

  const classrooms = await prisma.classroom.findMany()
  const periods = await prisma.period.findMany()

  if (classrooms.length === 0) {
    throw new Error("No classrooms available")
  }

  if (periods.length === 0) {
    throw new Error("No periods configured")
  }

  const days: Day[] = ["MON", "TUE", "WED", "THU", "FRI"]
  const slots: Slot[] = [1, 2, 3, 4, 5, 6, 7, 8]

  // Track teacher workload for fair distribution
  const teacherWorkload: Record<string, number> = {}
  for (const assignment of classSubjects) {
    teacherWorkload[assignment.teacherId] = 0
  }

  // Sort assignments to ensure ALL are processed:
  // 1. Prioritize assignments with fewer available teachers for the subject (more constrained first)
  // 2. Then by creation date (newer assignments first to ensure they're included)
  // 3. Then by teacher workload (less workload first for fairness)
  const sortedAssignments = [...classSubjects].sort((a, b) => {
    const aTeachers = classSubjects.filter((cs) => cs.subjectId === a.subjectId).length
    const bTeachers = classSubjects.filter((cs) => cs.subjectId === b.subjectId).length
    
    // First, sort by subject constraint (more constrained first)
    if (aTeachers !== bTeachers) {
      return aTeachers - bTeachers
    }
    
    // Then by creation date (newer first to ensure new teachers are included)
    const aDate = new Date(a.createdAt).getTime()
    const bDate = new Date(b.createdAt).getTime()
    if (aDate !== bDate) {
      return bDate - aDate // Newer first
    }
    
    // Finally by teacher workload (less workload first for fairness)
    const aWorkload = teacherWorkload[a.teacherId] || 0
    const bWorkload = teacherWorkload[b.teacherId] || 0
    return aWorkload - bWorkload
  })
  
  console.log("Sorted assignments order:")
  sortedAssignments.forEach((cs, idx) => {
    console.log(`${idx + 1}. ${cs.grade.name} - ${cs.subject.name} (${cs.teacher.name}) - Created: ${cs.createdAt}`)
  })

  const schedule: ScheduleEntry[] = []
  const teacherConstraints: Constraint[] = []
  const classroomConstraints: ClassroomConstraint[] = []
  const gradeSlotCount: Record<string, Record<Day, number>> = {}

  // Initialize grade slot counts
  for (const assignment of classSubjects) {
    if (!gradeSlotCount[assignment.gradeId]) {
      gradeSlotCount[assignment.gradeId] = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0 }
    }
  }

  // Backtracking algorithm
  function canPlace(
    assignment: typeof classSubjects[0],
    day: Day,
    slot: Slot,
    classroomId: string
  ): boolean {
    // Check teacher availability
    let teacherAvail: Record<string, number[]> | null = null
    if (assignment.teacher.availability) {
      try {
        teacherAvail = typeof assignment.teacher.availability === 'string' 
          ? JSON.parse(assignment.teacher.availability)
          : assignment.teacher.availability
      } catch (e) {
        // Invalid JSON, ignore availability
      }
    }
    if (teacherAvail && teacherAvail[day] && !teacherAvail[day].includes(slot)) {
      return false
    }

    // Check teacher not in two places
    if (teacherConstraints.some((c) => c.teacherId === assignment.teacherId && c.day === day && c.slot === slot)) {
      return false
    }

    // Check classroom not double-booked (only check for ACTIVE schedules)
    // Canceled classes don't block the classroom
    const existingSchedule = schedule.find(
      (s) => s.classroomId === classroomId && s.day === day && s.slot === slot
    )
    if (existingSchedule) {
      // Check if there's an active schedule in the database for this slot
      // For now, we'll check the constraints array which only tracks active schedules
      if (classroomConstraints.some((c) => c.classroomId === classroomId && c.day === day && c.slot === slot)) {
        return false
      }
    }

    // Check grade not in two places same slot
    if (schedule.some((s) => s.gradeId === assignment.gradeId && s.day === day && s.slot === slot)) {
      return false
    }

    // Check classroom capacity matches student count
    const classroom = classrooms.find((c) => c.id === classroomId)
    const studentCount = assignment.grade.studentCount || 0
    if (classroom && studentCount > 0) {
      // Classroom capacity must be >= student count
      if (classroom.capacity < studentCount) {
        return false
      }
    }

    return true
  }

  function backtrack(index: number, allowPartial: boolean = false): boolean {
    if (index >= sortedAssignments.length) {
      return true // All assignments processed
    }

    const assignment = sortedAssignments[index]
    const hoursNeeded = assignment.subject.hoursPerWeek
    const currentHours = schedule.filter((s) => 
      s.gradeId === assignment.gradeId && s.subjectId === assignment.subjectId
    ).length

    if (currentHours >= hoursNeeded) {
      return backtrack(index + 1, allowPartial) // Already satisfied, move to next
    }

    // Try to place remaining hours - try multiple times for each hour needed
    const remainingHours = hoursNeeded - currentHours

    // Shuffle days and slots for better distribution
    const shuffledDays = [...days].sort(() => Math.random() - 0.5)
    const shuffledSlots = [...slots].sort(() => Math.random() - 0.5)
    
    // Sort classrooms by capacity matching - prioritize classrooms that match student count
    const studentCount = assignment.grade.studentCount || 0
    const shuffledClassrooms = [...classrooms].sort((a, b) => {
      if (studentCount > 0) {
        // Prefer classrooms that can fit the students (capacity >= studentCount)
        const aFits = a.capacity >= studentCount
        const bFits = b.capacity >= studentCount
        if (aFits !== bFits) {
          return aFits ? -1 : 1 // aFits first
        }
        // If both fit, prefer the one with capacity closest to student count (but >=)
        if (aFits && bFits) {
          return Math.abs(a.capacity - studentCount) - Math.abs(b.capacity - studentCount)
        }
      }
      // If no student count specified, randomize
      return Math.random() - 0.5
    })

    // Try to place each remaining hour
    let placedCount = 0
    for (let hour = 0; hour < remainingHours; hour++) {
      let placed = false
      
      for (const day of shuffledDays) {
        for (const slot of shuffledSlots) {
          for (const classroom of shuffledClassrooms) {
            if (canPlace(assignment, day, slot, classroom.id)) {
              // Place assignment
              schedule.push({
                gradeId: assignment.gradeId,
                classroomId: classroom.id,
                teacherId: assignment.teacherId,
                subjectId: assignment.subjectId,
                day,
                slot,
              })

              teacherConstraints.push({ teacherId: assignment.teacherId, day, slot })
              classroomConstraints.push({ classroomId: classroom.id, day, slot })
              teacherWorkload[assignment.teacherId] = (teacherWorkload[assignment.teacherId] || 0) + 1
              placed = true
              placedCount++
              break
            }
          }
          if (placed) break
        }
        if (placed) break
      }
      
      // If couldn't place this hour and we're not allowing partial, try to backtrack
      if (!placed && !allowPartial) {
        // If we placed at least some hours, continue with next assignment
        if (placedCount > 0 || currentHours > 0) {
          return backtrack(index + 1, allowPartial)
        }
        // If this is a new assignment with 0 hours, try to continue anyway
        // Don't fail completely - allow partial placement
        return backtrack(index + 1, true)
      }
    }

    // Move to next assignment (whether fully placed or partially placed)
    return backtrack(index + 1, allowPartial)
  }

  // Run backtracking with multiple attempts for better success rate
  let bestSchedule: ScheduleEntry[] = []
  let bestScore = 0
  let bestTeacherCoverage = 0
  const maxAttempts = 20 // Increased attempts to ensure all teachers are included
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Clear previous attempt
    schedule.length = 0
    teacherConstraints.length = 0
    classroomConstraints.length = 0
    // Reset teacher workload for this attempt
    for (const assignment of classSubjects) {
      teacherWorkload[assignment.teacherId] = 0
    }
    
    // Try with different randomizations, allowing partial placements
    backtrack(0, true)
    
    // Calculate score (total hours placed)
    const totalPlaced = schedule.length
    const totalNeeded = classSubjects.reduce((sum, cs) => sum + cs.subject.hoursPerWeek, 0)
    
    // Count unique teachers with at least one schedule entry
    const teachersWithSchedule = new Set(schedule.map(s => s.teacherId)).size
    const totalTeachers = teachersInAssignments.size
    
    // Score based on both total placed AND teacher coverage (prioritize teacher coverage)
    const score = totalPlaced + (teachersWithSchedule * 100)
    
    // Keep the best attempt (prefer better teacher coverage)
    if (score > bestScore || (score === bestScore && teachersWithSchedule > bestTeacherCoverage)) {
      bestScore = score
      bestTeacherCoverage = teachersWithSchedule
      bestSchedule = [...schedule]
      console.log(`Attempt ${attempt + 1}: Placed ${totalPlaced}/${totalNeeded} hours, ${teachersWithSchedule}/${totalTeachers} teachers covered`)
    }
    
    // If we placed everything perfectly and all teachers are covered, we're done
    if (totalPlaced >= totalNeeded && teachersWithSchedule >= totalTeachers) {
      console.log(`✅ Perfect placement achieved on attempt ${attempt + 1}`)
      break
    }
  }
  
  // Log final teacher coverage
  const finalTeachersWithSchedule = new Set(bestSchedule.map(s => s.teacherId)).size
  console.log(`📊 Final result: ${bestSchedule.length} schedule entries, ${finalTeachersWithSchedule}/${teachersInAssignments.size} teachers have schedules`)
  
  // Use the best schedule we found
  schedule.length = 0
  schedule.push(...bestSchedule)
  
  // Rebuild constraints from best schedule
  teacherConstraints.length = 0
  classroomConstraints.length = 0
  for (const entry of schedule) {
    teacherConstraints.push({ teacherId: entry.teacherId, day: entry.day, slot: entry.slot })
    classroomConstraints.push({ classroomId: entry.classroomId, day: entry.day, slot: entry.slot })
  }
  
  const success = schedule.length > 0

  // Verify all hours are met and provide detailed report
  const warnings: string[] = []
  const errors: string[] = []
  const teachersWithSchedules = new Set<string>()
  
  for (const assignment of classSubjects) {
    const placedHours = schedule.filter(
      (s) => s.gradeId === assignment.gradeId && s.subjectId === assignment.subjectId && s.teacherId === assignment.teacherId
    ).length

    if (placedHours > 0) {
      teachersWithSchedules.add(assignment.teacherId)
    }

    if (placedHours < assignment.subject.hoursPerWeek) {
      const message = `${assignment.grade.name} - ${assignment.subject.name} (${assignment.teacher.name}): only ${placedHours}/${assignment.subject.hoursPerWeek} hours placed`
      if (placedHours === 0) {
        errors.push(message)
      } else {
        warnings.push(message)
      }
    }
  }
  
  // Report on teacher coverage
  const teachersWithoutSchedules = Array.from(teachersInAssignments).filter(tId => !teachersWithSchedules.has(tId))
  if (teachersWithoutSchedules.length > 0) {
    console.error(`❌ ${teachersWithoutSchedules.length} teacher(s) have NO schedule entries:`)
    teachersWithoutSchedules.forEach(teacherId => {
      const teacher = classSubjects.find(cs => cs.teacherId === teacherId)?.teacher
      if (teacher) {
        console.error(`  - ${teacher.name} (ID: ${teacherId})`)
      }
    })
  } else {
    console.log(`✅ All ${teachersInAssignments.size} teachers have at least one schedule entry`)
  }
  
  if (warnings.length > 0) {
    console.warn("⚠️ Partial placements:", warnings)
  }
  
  if (errors.length > 0) {
    console.error("❌ Failed to place:", errors)
  }
  
  if (errors.length > 0 && schedule.length === 0) {
    throw new Error(`Could not generate timetable. Failed to place: ${errors.join(", ")}`)
  }

  // Save to database
  if (schedule.length > 0) {
    try {
      // Check if prisma.schedule exists
      if (!prisma || !prisma.schedule) {
        throw new Error("Prisma client or schedule model is not available")
      }

      await prisma.schedule.createMany({
        data: schedule.map((s) => ({
          gradeId: s.gradeId,
          classroomId: s.classroomId,
          teacherId: s.teacherId,
          subjectId: s.subjectId,
          day: s.day,
          slot: s.slot,
          status: "ACTIVE", // All newly generated schedules are active
        })),
      })
    } catch (dbError: any) {
      console.error("Database error:", dbError)
      throw new Error(`Failed to save schedule to database: ${dbError.message || "Unknown error"}`)
    }
    console.log(`✅ Saved ${schedule.length} schedule entries to database`)
    
    // Verify what was saved
    const savedSchedules = await prisma.schedule.findMany({
      include: {
        grade: true,
        subject: true,
        teacher: true,
      },
    })
    console.log(`✅ Verified: ${savedSchedules.length} schedules in database`)
    savedSchedules.forEach((s) => {
      console.log(`  - ${s.grade.name} - ${s.subject.name} (${s.teacher.name}) on ${s.day} slot ${s.slot}`)
    })
  } else {
    console.warn("⚠️ No schedule entries to save!")
  }

  const totalNeeded = classSubjects.reduce((sum, cs) => sum + cs.subject.hoursPerWeek, 0)
  const placementRate = totalNeeded > 0 ? Math.round((schedule.length / totalNeeded) * 100) : 100
  
  return {
    success: true,
    scheduleCount: schedule.length,
    totalNeeded,
    placementRate,
    message: schedule.length === totalNeeded 
      ? "Timetable generated successfully - all assignments placed"
      : `Timetable generated - ${schedule.length}/${totalNeeded} hours placed (${placementRate}%)`,
  }
}

