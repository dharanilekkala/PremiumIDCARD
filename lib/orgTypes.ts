import {
  GraduationCap, Building2, Stethoscope, Zap,
  BookOpen, University, Calendar, Users,
} from "lucide-react";

export type OrgTypeId =
  | "school"
  | "college"
  | "university"
  | "coaching"
  | "corporate"
  | "hospital"
  | "event"
  | "custom";

export interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "date" | "tel" | "email" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  group?: "identity" | "academic" | "family" | "contact" | "medical" | "other";
}

export interface OrgType {
  id: OrgTypeId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;           // hex accent
  gradient: string;        // tailwind gradient classes
  fields: FieldDef[];
  bulkColumns: string[];
  cardTitle: string;       // e.g. "STUDENT IDENTITY CARD"
  aiKeywords: string[];    // keywords the AI looks for to auto-detect
}

export const ORG_TYPES: OrgType[] = [
  {
    id: "school",
    label: "School",
    shortLabel: "School",
    description: "K-12 student ID cards",
    icon: GraduationCap,
    color: "#6366f1",
    gradient: "from-brand-500 to-violet-500",
    cardTitle: "STUDENT IDENTITY CARD",
    aiKeywords: ["student", "class", "section", "roll no", "admission", "principal", "school"],
    bulkColumns: [
      "Student Name", "Admission Number", "Roll Number", "Class", "Section",
      "Father Name", "Mother Name", "Parent Mobile", "Blood Group", "Address",
    ],
    fields: [
      { key: "studentName", label: "Student Name", placeholder: "e.g. Priya Sharma", type: "text", required: true, group: "identity" },
      { key: "admissionNo", label: "Admission Number", placeholder: "e.g. ADM-2024-001", type: "text", required: true, group: "identity" },
      { key: "rollNumber", label: "Roll Number", placeholder: "e.g. 24", type: "text", group: "academic" },
      { key: "class", label: "Class", placeholder: "e.g. X", type: "select", options: ["Nursery","KG","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"], required: true, group: "academic" },
      { key: "section", label: "Section", placeholder: "e.g. A", type: "select", options: ["A","B","C","D","E","F"], group: "academic" },
      { key: "academicYear", label: "Academic Year", placeholder: "e.g. 2024-25", type: "text", group: "academic" },
      { key: "fatherName", label: "Father's Name", placeholder: "e.g. Rajesh Sharma", type: "text", group: "family" },
      { key: "motherName", label: "Mother's Name", placeholder: "e.g. Sunita Sharma", type: "text", group: "family" },
      { key: "parentMobile", label: "Parent Mobile", placeholder: "e.g. +91 98765 43210", type: "tel", required: true, group: "family" },
      { key: "studentMobile", label: "Student Mobile", placeholder: "Optional", type: "tel", group: "contact" },
      { key: "address", label: "Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", placeholder: "e.g. O+", type: "select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
      { key: "dateOfBirth", label: "Date of Birth", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "busRoute", label: "Bus Route", placeholder: "e.g. Route 7 – Andheri", type: "text", group: "other" },
      { key: "houseName", label: "House Name", placeholder: "e.g. Red House", type: "text", group: "other" },
      { key: "emergencyContact", label: "Emergency Contact", placeholder: "e.g. +91 98765 00000", type: "tel", group: "contact" },
    ],
  },
  {
    id: "college",
    label: "College",
    shortLabel: "College",
    description: "Degree & diploma student IDs",
    icon: BookOpen,
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-500",
    cardTitle: "STUDENT IDENTITY CARD",
    aiKeywords: ["college", "course", "semester", "branch", "hall ticket", "enrollment"],
    bulkColumns: [
      "Student Name", "Hall Ticket No", "Course", "Branch", "Year", "Semester",
      "Parent Phone", "Student Phone", "Address", "Blood Group",
    ],
    fields: [
      { key: "studentName", label: "Student Name", placeholder: "e.g. Amit Singh", type: "text", required: true, group: "identity" },
      { key: "hallTicketNo", label: "Hall Ticket Number", placeholder: "e.g. 22B1A0501", type: "text", required: true, group: "identity" },
      { key: "enrollmentNo", label: "Enrollment Number", placeholder: "Optional", type: "text", group: "identity" },
      { key: "course", label: "Course", placeholder: "e.g. B.Tech", type: "select", options: ["B.Tech","B.E.","B.Sc","B.Com","B.A","MBA","M.Tech","MCA","BCA","BBA","B.Pharm","MBBS","B.Ed"], required: true, group: "academic" },
      { key: "branch", label: "Branch / Specialization", placeholder: "e.g. Computer Science", type: "text", group: "academic" },
      { key: "year", label: "Year", placeholder: "e.g. 2nd Year", type: "select", options: ["1st Year","2nd Year","3rd Year","4th Year","5th Year"], group: "academic" },
      { key: "semester", label: "Semester", placeholder: "e.g. 3rd Semester", type: "select", options: ["1st","2nd","3rd","4th","5th","6th","7th","8th"], group: "academic" },
      { key: "parentName", label: "Parent / Guardian Name", placeholder: "e.g. Vijay Singh", type: "text", group: "family" },
      { key: "parentPhone", label: "Parent Phone", placeholder: "e.g. +91 98765 43210", type: "tel", group: "family" },
      { key: "studentPhone", label: "Student Phone", placeholder: "e.g. +91 91234 56789", type: "tel", group: "contact" },
      { key: "email", label: "College Email", placeholder: "e.g. amit@college.edu", type: "email", group: "contact" },
      { key: "address", label: "Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", placeholder: "e.g. B+", type: "select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
      { key: "admissionYear", label: "Admission Year", placeholder: "e.g. 2022", type: "text", group: "academic" },
      { key: "expiryDate", label: "Valid Till", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
    ],
  },
  {
    id: "university",
    label: "University",
    shortLabel: "University",
    description: "University student & faculty IDs",
    icon: University,
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-500",
    cardTitle: "UNIVERSITY IDENTITY CARD",
    aiKeywords: ["university", "faculty", "professor", "department", "reg no", "scholar"],
    bulkColumns: ["Student Name","Registration No","Faculty","Department","Programme","Year","Phone","Email"],
    fields: [
      { key: "studentName", label: "Full Name", placeholder: "e.g. Dr. Kavita Nair", type: "text", required: true, group: "identity" },
      { key: "regNo", label: "Registration Number", placeholder: "e.g. REG/2023/001", type: "text", required: true, group: "identity" },
      { key: "faculty", label: "Faculty", placeholder: "e.g. Faculty of Engineering", type: "text", group: "academic" },
      { key: "department", label: "Department", placeholder: "e.g. Computer Science", type: "text", required: true, group: "academic" },
      { key: "programme", label: "Programme", placeholder: "e.g. Ph.D / M.Tech", type: "text", group: "academic" },
      { key: "year", label: "Year of Study", placeholder: "e.g. 1st Year", type: "text", group: "academic" },
      { key: "phone", label: "Phone", placeholder: "e.g. +91 98765 43210", type: "tel", group: "contact" },
      { key: "email", label: "University Email", placeholder: "e.g. user@univ.edu", type: "email", group: "contact" },
      { key: "address", label: "Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", type: "select", placeholder: "Select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
      { key: "issueDate", label: "Issue Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "expiryDate", label: "Expiry Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
    ],
  },
  {
    id: "coaching",
    label: "Coaching",
    shortLabel: "Coaching",
    description: "Coaching institute student IDs",
    icon: Zap,
    color: "#06b6d4",
    gradient: "from-cyan-500 to-blue-500",
    cardTitle: "STUDENT IDENTITY CARD",
    aiKeywords: ["coaching", "batch", "subject", "target", "jee", "neet", "upsc"],
    bulkColumns: ["Student Name","Student ID","Course","Batch","Target Exam","Parent Mobile","Phone"],
    fields: [
      { key: "studentName", label: "Student Name", placeholder: "e.g. Rohit Verma", type: "text", required: true, group: "identity" },
      { key: "studentId", label: "Student ID", placeholder: "e.g. COA-2024-042", type: "text", required: true, group: "identity" },
      { key: "course", label: "Course", placeholder: "e.g. JEE Advanced", type: "text", required: true, group: "academic" },
      { key: "batch", label: "Batch", placeholder: "e.g. Morning Batch A", type: "text", group: "academic" },
      { key: "targetExam", label: "Target Exam", placeholder: "e.g. JEE / NEET / UPSC", type: "select", options: ["JEE Main","JEE Advanced","NEET","UPSC","CAT","GATE","CLAT","CA Foundation","Other"], group: "academic" },
      { key: "joiningDate", label: "Joining Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "validTill", label: "Valid Till", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "fatherName", label: "Father's Name", placeholder: "e.g. Suresh Verma", type: "text", group: "family" },
      { key: "parentMobile", label: "Parent Mobile", placeholder: "e.g. +91 98765 43210", type: "tel", required: true, group: "family" },
      { key: "studentMobile", label: "Student Mobile", placeholder: "e.g. +91 91234 56789", type: "tel", group: "contact" },
      { key: "address", label: "Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", type: "select", placeholder: "Select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
    ],
  },
  {
    id: "corporate",
    label: "Corporate",
    shortLabel: "Office",
    description: "Employee ID cards",
    icon: Building2,
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    cardTitle: "EMPLOYEE IDENTITY CARD",
    aiKeywords: ["employee", "emp id", "department", "designation", "company", "corporate", "joining"],
    bulkColumns: ["Employee Name","Employee ID","Department","Designation","Phone","Email","Manager","Joining Date"],
    fields: [
      { key: "employeeName", label: "Employee Name", placeholder: "e.g. Rahul Kumar", type: "text", required: true, group: "identity" },
      { key: "employeeId", label: "Employee ID", placeholder: "e.g. EMP-001", type: "text", required: true, group: "identity" },
      { key: "department", label: "Department", placeholder: "e.g. Engineering", type: "text", required: true, group: "academic" },
      { key: "designation", label: "Designation", placeholder: "e.g. Senior Manager", type: "text", required: true, group: "academic" },
      { key: "phone", label: "Phone", placeholder: "e.g. +91 98765 43210", type: "tel", group: "contact" },
      { key: "email", label: "Work Email", placeholder: "e.g. rahul@company.com", type: "email", group: "contact" },
      { key: "address", label: "Office / Home Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "managerName", label: "Reporting Manager", placeholder: "e.g. Anita Joshi", type: "text", group: "other" },
      { key: "joiningDate", label: "Joining Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "expiryDate", label: "Card Expiry", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "bloodGroup", label: "Blood Group", type: "select", placeholder: "Select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
      { key: "accessLevel", label: "Access Level", placeholder: "e.g. L3 – All Floors", type: "text", group: "other" },
    ],
  },
  {
    id: "hospital",
    label: "Hospital",
    shortLabel: "Hospital",
    description: "Doctor, nurse & staff IDs",
    icon: Stethoscope,
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    cardTitle: "STAFF IDENTITY CARD",
    aiKeywords: ["doctor", "nurse", "hospital", "ward", "mbbs", "md", "patient", "clinical"],
    bulkColumns: ["Staff Name","Staff ID","Designation","Department","Specialization","Phone","Email","Blood Group"],
    fields: [
      { key: "staffName", label: "Staff Name", placeholder: "e.g. Dr. Meera Nair", type: "text", required: true, group: "identity" },
      { key: "staffId", label: "Staff ID", placeholder: "e.g. HOSP-DOC-042", type: "text", required: true, group: "identity" },
      { key: "designation", label: "Designation", placeholder: "e.g. Senior Cardiologist", type: "select", options: ["Doctor","Senior Doctor","Nurse","Head Nurse","Technician","Admin Staff","Pharmacist","Radiologist","Surgeon","Intern","Resident Doctor"], required: true, group: "academic" },
      { key: "department", label: "Department", placeholder: "e.g. Cardiology", type: "text", required: true, group: "academic" },
      { key: "specialization", label: "Specialization", placeholder: "e.g. MBBS, MD (Cardiology)", type: "text", group: "academic" },
      { key: "regNo", label: "Medical Reg. Number", placeholder: "e.g. MCI/KA/2018/001", type: "text", group: "identity" },
      { key: "phone", label: "Phone", placeholder: "e.g. +91 98765 43210", type: "tel", group: "contact" },
      { key: "email", label: "Email", placeholder: "e.g. dr.meera@hospital.com", type: "email", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", type: "select", placeholder: "Select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], required: true, group: "medical" },
      { key: "joiningDate", label: "Joining Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "expiryDate", label: "Card Expiry", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
    ],
  },
  {
    id: "event",
    label: "Events",
    shortLabel: "Events",
    description: "Conference & event passes",
    icon: Calendar,
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-500",
    cardTitle: "EVENT DELEGATE PASS",
    aiKeywords: ["event", "delegate", "conference", "pass", "seminar", "registration", "attendee"],
    bulkColumns: ["Delegate Name","Registration ID","Organization","Designation","Category","Phone","Email"],
    fields: [
      { key: "delegateName", label: "Delegate Name", placeholder: "e.g. Dr. Anita Mehta", type: "text", required: true, group: "identity" },
      { key: "registrationId", label: "Registration ID", placeholder: "e.g. CONF-2024-001", type: "text", required: true, group: "identity" },
      { key: "organization", label: "Organization", placeholder: "e.g. IIM Ahmedabad", type: "text", group: "other" },
      { key: "designation", label: "Designation", placeholder: "e.g. Professor", type: "text", group: "academic" },
      { key: "category", label: "Delegate Category", placeholder: "e.g. Speaker / Attendee", type: "select", options: ["Speaker","Keynote Speaker","Delegate","VIP","Volunteer","Media","Organizer","Sponsor"], group: "other" },
      { key: "eventName", label: "Event Name", placeholder: "e.g. National Tech Summit 2024", type: "text", group: "other" },
      { key: "eventDate", label: "Event Date", placeholder: "DD/MM/YYYY", type: "date", group: "other" },
      { key: "eventVenue", label: "Venue", placeholder: "e.g. IIM Ahmedabad, Gujarat", type: "text", group: "other" },
      { key: "phone", label: "Phone", placeholder: "e.g. +91 98765 43210", type: "tel", group: "contact" },
      { key: "email", label: "Email", placeholder: "e.g. delegate@org.com", type: "email", group: "contact" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    shortLabel: "Custom",
    description: "Any other organization",
    icon: Users,
    color: "#64748b",
    gradient: "from-slate-500 to-slate-600",
    cardTitle: "IDENTITY CARD",
    aiKeywords: [],
    bulkColumns: ["Name","ID Number","Department","Designation","Phone","Email","Address"],
    fields: [
      { key: "name", label: "Name", placeholder: "Full Name", type: "text", required: true, group: "identity" },
      { key: "idNumber", label: "ID Number", placeholder: "e.g. ID-001", type: "text", required: true, group: "identity" },
      { key: "organization", label: "Organization", placeholder: "Organization name", type: "text", group: "other" },
      { key: "designation", label: "Designation / Role", placeholder: "e.g. Member", type: "text", group: "academic" },
      { key: "department", label: "Department / Group", placeholder: "e.g. General", type: "text", group: "academic" },
      { key: "phone", label: "Phone", placeholder: "Phone number", type: "tel", group: "contact" },
      { key: "email", label: "Email", placeholder: "Email address", type: "email", group: "contact" },
      { key: "address", label: "Address", placeholder: "Full address", type: "textarea", group: "contact" },
      { key: "bloodGroup", label: "Blood Group", type: "select", placeholder: "Select", options: ["A+","A-","B+","B-","O+","O-","AB+","AB-"], group: "medical" },
      { key: "issueDate", label: "Issue Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
      { key: "expiryDate", label: "Expiry Date", placeholder: "DD/MM/YYYY", type: "date", group: "identity" },
    ],
  },
];

export const getOrgType = (id: OrgTypeId): OrgType =>
  ORG_TYPES.find((o) => o.id === id) ?? ORG_TYPES[0];

/** Simulate AI detection of org type from uploaded card keywords */
export function detectOrgType(imageDescription: string): OrgTypeId {
  const lower = imageDescription.toLowerCase();
  for (const org of ORG_TYPES) {
    if (org.aiKeywords.some((kw) => lower.includes(kw))) return org.id;
  }
  return "school"; // default
}
