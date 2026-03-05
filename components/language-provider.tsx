"use client"

import * as React from "react"

type Language = "en" | "am"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "Smart School Scheduler",
    "login.title": "Login",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.google": "Sign in with Google",
    "admin.dashboard": "Dashboard",
    "admin.teachers": "Teachers",
    "admin.classrooms": "Classrooms",
    "admin.grades": "Grades",
    "admin.subjects": "Subjects",
    "admin.assignments": "Assignments",
    "admin.schedule": "Schedule",
    "admin.generate": "Generate Timetable",
    "admin.overview": "Overview",
    "admin.analytics": "Analytics",
    "admin.quickActions": "Quick Actions",
    "admin.exportData": "Export Data",
    "admin.exportSchedule": "Export Schedule",
    "admin.gettingStarted": "Getting Started",
    "admin.addTeachers": "Add Teachers",
    "admin.addClassrooms": "Add Classrooms",
    "admin.addGrades": "Add Grades",
    "admin.addSubjects": "Add Subjects",
    "admin.assignSubjects": "Assign subjects to grades with teachers",
    "admin.generateTimetable": "Generate Timetable",
    "admin.manageSystem": "Manage your school's scheduling system",
    "admin.downloadSchedules": "Download schedules and data",
    "admin.followSteps": "Follow these steps to set up your schedule",
    "schedule.title": "Schedule",
    "schedule.viewManage": "View and manage the complete timetable",
    "schedule.generate": "Generate Timetable",
    "schedule.export": "Export",
    "schedule.totalSchedules": "Total Schedules",
    "schedule.activeSchedules": "Active Schedules",
    "schedule.canceledSchedules": "Canceled Schedules",
    "schedule.teachers": "Teachers",
    "schedule.classrooms": "Classrooms",
    "schedule.grades": "Grades",
    "schedule.subjects": "Subjects",
    "occupancy.title": "Real-time Occupancy",
    "teacher.dashboard": "Teacher Dashboard",
    "teacher.welcome": "Welcome",
    "teacher.todaySchedule": "Today's Schedule",
    "teacher.weeklyView": "Weekly View",
    "teacher.notes": "Quick Notes",
    "student.dashboard": "Student Dashboard",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search",
    "common.export": "Export",
    "common.import": "Import",
  },
  am: {
    "app.name": "ዘመናዊ የትምህርት ቤት የጊዜ ሰሌዳ",
    "login.title": "ግባ",
    "login.email": "ኢሜይል",
    "login.password": "የይለፍ ቃል",
    "login.submit": "ግባ",
    "login.google": "በጉግል ይግቡ",
    "admin.dashboard": "ዳሽቦርድ",
    "admin.teachers": "አስተማሪዎች",
    "admin.classrooms": "ክፍሎች",
    "admin.grades": "ደረጃዎች",
    "admin.subjects": "አስመሳይ ርዕሶች",
    "admin.assignments": "ምድቦች",
    "admin.schedule": "የጊዜ ሰሌዳ",
    "admin.generate": "የጊዜ ሰሌዳ ይፍጠሩ",
    "admin.overview": "አጠቃላይ እይታ",
    "admin.analytics": "ትንተና",
    "admin.quickActions": "ፈጣን ድርጊቶች",
    "admin.exportData": "ውሂብ ማውጣት",
    "admin.exportSchedule": "የጊዜ ሰሌዳ ማውጣት",
    "admin.gettingStarted": "መጀመሪያ",
    "admin.addTeachers": "አስተማሪዎች ያክሉ",
    "admin.addClassrooms": "ክፍሎች ያክሉ",
    "admin.addGrades": "ደረጃዎች ያክሉ",
    "admin.addSubjects": "አስመሳይ ርዕሶች ያክሉ",
    "admin.assignSubjects": "አስመሳይ ርዕሶችን ከአስተማሪዎች ጋር ለደረጃዎች ይመድቡ",
    "admin.generateTimetable": "የጊዜ ሰሌዳ ይፍጠሩ",
    "admin.manageSystem": "የትምህርት ቤትዎን የጊዜ ሰሌዳ ስርዓት ያቀናብሩ",
    "admin.downloadSchedules": "የጊዜ ሰሌዳዎችን እና ውሂቦችን ያውርዱ",
    "admin.followSteps": "የጊዜ ሰሌዳዎን ለማዋቀር እነዚህን ደረጃዎች ይከተሉ",
    "schedule.title": "የጊዜ ሰሌዳ",
    "schedule.viewManage": "ሙሉውን የጊዜ ሰሌዳ ይመልከቱ እና ያቀናብሩ",
    "schedule.generate": "የጊዜ ሰሌዳ ይፍጠሩ",
    "schedule.export": "ማውጣት",
    "schedule.totalSchedules": "ጠቅላላ የጊዜ ሰሌዳዎች",
    "schedule.activeSchedules": "ንቁ የጊዜ ሰሌዳዎች",
    "schedule.canceledSchedules": "የተሰረዙ የጊዜ ሰሌዳዎች",
    "schedule.teachers": "አስተማሪዎች",
    "schedule.classrooms": "ክፍሎች",
    "schedule.grades": "ደረጃዎች",
    "schedule.subjects": "አስመሳይ ርዕሶች",
    "occupancy.title": "በቀጥታ የመጠቀሚያ ሁኔታ",
    "teacher.dashboard": "የአስተማሪ ዳሽቦርድ",
    "teacher.welcome": "እንኳን ደህና መጡ",
    "teacher.todaySchedule": "የዛሬ የጊዜ ሰሌዳ",
    "teacher.weeklyView": "የሳምንት እይታ",
    "teacher.notes": "ፈጣን ማስታወሻዎች",
    "student.dashboard": "የተማሪ ዳሽቦርድ",
    "common.loading": "በመጫን ላይ...",
    "common.error": "ስህተት",
    "common.success": "ተሳክቷል",
    "common.save": "አስቀምጥ",
    "common.cancel": "ተወው",
    "common.delete": "ሰርዝ",
    "common.edit": "አርም",
    "common.add": "ጨምር",
    "common.search": "ፈልግ",
    "common.export": "ማውጣት",
    "common.import": "ማስገባት",
  },
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(
  undefined
)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>("en")

  const t = React.useCallback(
    (key: string) => {
      return translations[language][key] || key
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}






