import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Note: Make sure to run `npx prisma db push` before seeding

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      email: "admin@school.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  // Create teachers
  const availability = JSON.stringify({
    MON: [1, 2, 3, 4, 5, 6, 7, 8],
    TUE: [1, 2, 3, 4, 5, 6, 7, 8],
    WED: [1, 2, 3, 4, 5, 6, 7, 8],
    THU: [1, 2, 3, 4, 5, 6, 7, 8],
    FRI: [1, 2, 3, 4, 5, 6, 7, 8],
  })

  // Create teacher users with secure passwords
  const teacher1Password = await bcrypt.hash("teacher1@2024", 10)
  const teacher1User = await prisma.user.upsert({
    where: { email: "john.smith@school.com" },
    update: {},
    create: {
      email: "john.smith@school.com",
      name: "John Smith",
      password: teacher1Password,
      role: "TEACHER",
    },
  })

  const teacher2Password = await bcrypt.hash("teacher2@2024", 10)
  const teacher2User = await prisma.user.upsert({
    where: { email: "mary.johnson@school.com" },
    update: {},
    create: {
      email: "mary.johnson@school.com",
      name: "Mary Johnson",
      password: teacher2Password,
      role: "TEACHER",
    },
  })

  const teacher3Password = await bcrypt.hash("teacher3@2024", 10)
  const teacher3User = await prisma.user.upsert({
    where: { email: "david.brown@school.com" },
    update: {},
    create: {
      email: "david.brown@school.com",
      name: "David Brown",
      password: teacher3Password,
      role: "TEACHER",
    },
  })

  const teacher1 = await prisma.teacher.upsert({
    where: { id: "teacher1" },
    update: {},
    create: {
      id: "teacher1",
      name: "John Smith",
      userId: teacher1User.id,
      availability,
    },
  })

  const teacher2 = await prisma.teacher.upsert({
    where: { id: "teacher2" },
    update: {},
    create: {
      id: "teacher2",
      name: "Mary Johnson",
      userId: teacher2User.id,
      availability,
    },
  })

  const teacher3 = await prisma.teacher.upsert({
    where: { id: "teacher3" },
    update: {},
    create: {
      id: "teacher3",
      name: "David Brown",
      userId: teacher3User.id,
      availability,
    },
  })

  // Create classrooms
  const classroom1 = await prisma.classroom.upsert({
    where: { id: "classroom1" },
    update: {},
    create: {
      id: "classroom1",
      name: "Room 101",
      capacity: 30,
    },
  })

  const classroom2 = await prisma.classroom.upsert({
    where: { id: "classroom2" },
    update: {},
    create: {
      id: "classroom2",
      name: "Room 102",
      capacity: 25,
    },
  })

  const classroom3 = await prisma.classroom.upsert({
    where: { id: "classroom3" },
    update: {},
    create: {
      id: "classroom3",
      name: "Room 103",
      capacity: 35,
    },
  })

  // Create grades
  const grade1 = await prisma.grade.upsert({
    where: { id: "grade1" },
    update: {},
    create: {
      id: "grade1",
      name: "Grade 10A",
    },
  })

  const grade2 = await prisma.grade.upsert({
    where: { id: "grade2" },
    update: {},
    create: {
      id: "grade2",
      name: "Grade 10B",
    },
  })

  // Create subjects
  const math = await prisma.subject.upsert({
    where: { id: "subject1" },
    update: {},
    create: {
      id: "subject1",
      name: "Mathematics",
      hoursPerWeek: 5,
    },
  })

  const english = await prisma.subject.upsert({
    where: { id: "subject2" },
    update: {},
    create: {
      id: "subject2",
      name: "English",
      hoursPerWeek: 4,
    },
  })

  const science = await prisma.subject.upsert({
    where: { id: "subject3" },
    update: {},
    create: {
      id: "subject3",
      name: "Science",
      hoursPerWeek: 4,
    },
  })

  // Create periods
  const periodTimes = [
    { slot: 1, start: "08:00", end: "08:45" },
    { slot: 2, start: "08:45", end: "09:30" },
    { slot: 3, start: "09:30", end: "10:15" },
    { slot: 4, start: "10:15", end: "11:00" },
    { slot: 5, start: "11:00", end: "11:45" },
    { slot: 6, start: "11:45", end: "12:30" },
    { slot: 7, start: "12:30", end: "13:15" },
    { slot: 8, start: "13:15", end: "14:00" },
  ]

  for (const day of ["MON", "TUE", "WED", "THU", "FRI"]) {
    for (const period of periodTimes) {
      await prisma.period.upsert({
        where: {
          day_slot: {
            day,
            slot: period.slot,
          },
        },
        update: {},
        create: {
          day,
          slot: period.slot,
          startTime: period.start,
          endTime: period.end,
        },
      })
    }
  }

  // Create assignments
  await prisma.classSubject.upsert({
    where: {
      gradeId_subjectId: {
        gradeId: grade1.id,
        subjectId: math.id,
      },
    },
    update: {},
    create: {
      gradeId: grade1.id,
      subjectId: math.id,
      teacherId: teacher1.id,
    },
  })

  await prisma.classSubject.upsert({
    where: {
      gradeId_subjectId: {
        gradeId: grade1.id,
        subjectId: english.id,
      },
    },
    update: {},
    create: {
      gradeId: grade1.id,
      subjectId: english.id,
      teacherId: teacher2.id,
    },
  })

  await prisma.classSubject.upsert({
    where: {
      gradeId_subjectId: {
        gradeId: grade1.id,
        subjectId: science.id,
      },
    },
    update: {},
    create: {
      gradeId: grade1.id,
      subjectId: science.id,
      teacherId: teacher3.id,
    },
  })

  await prisma.classSubject.upsert({
    where: {
      gradeId_subjectId: {
        gradeId: grade2.id,
        subjectId: math.id,
      },
    },
    update: {},
    create: {
      gradeId: grade2.id,
      subjectId: math.id,
      teacherId: teacher1.id,
    },
  })

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

