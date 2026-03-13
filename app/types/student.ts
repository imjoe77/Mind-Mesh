export interface Subject {
  name: string
  percent: number
  color: string
}

export interface Activity {
  text: string
  bold: string
  time: string
  color: string
}

export interface Deadline {
  subject: string
  task: string
  date: string
}

export interface Student {
  name: string
  studentId: string
  course: string
  year: string
  credits: string
  gpa: string
  advisor: string
  status: string
  email: string
  phone: string
  semester: string
  attendance: string
  assignments: number
  subjects: Subject[]
  activity: Activity[]
  upcoming: Deadline[]
}