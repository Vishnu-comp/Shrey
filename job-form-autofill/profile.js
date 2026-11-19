// ============================================================
// YOUR DETAILS - edit the values on the right to update them.
// Keep the quotes. Then reload the extension on
// chrome://extensions (circular arrow icon on the card).
// ============================================================
const JFA_PROFILE = {
  firstName: "Vishnu",
  lastName: "Nair",
  fullName: "Vishnu Nair",
  email: "vishnunair2323@gmail.com",
  phone: "9967418222",
  phoneWithCode: "+919967418222",
  countryCode: "+91",

  dobISO: "2002-08-04",       // for calendar-style date fields
  dobText: "04/08/2002",      // for typed date fields (DD/MM/YYYY)
  gender: "Male",
  fatherName: "Murali",

  addressLine: "13th Main Road, 100 ft Road, Indiranagar",
  city: "Bengaluru",
  cityAlt: "Bangalore",
  state: "Karnataka",
  pincode: "560008",
  country: "India",

  currentCompany: "Shoffr",
  jobTitle: "Full Stack Developer",
  totalExperienceYears: "2",

  currentCtcAnnual: "800000",   // 8 LPA in rupees
  currentCtcLpa: "8",
  expectedCtcAnnual: "1200000", // 12 LPA in rupees
  expectedCtcLpa: "12",
  expectedMonthly: "100000",    // 1,00,000 per month
  noticePeriodDays: "30",
  noticePeriodText: "30 days",

  linkedin: "https://www.linkedin.com/in/vishnu-nair-tech",
  github: "https://github.com/Vishnu-comp",
  portfolio: "https://vishnunairportfolio.vercel.app",
  leetcode: "https://leetcode.com/u/Vishnu__Nair/",

  ugDegree: "BCA",
  ugCollege: "Kristu Jayanti Autonomous College",
  pgDegree: "MCA",
  pgCollege: "Christ University",

  skills: "Java, Spring Boot, MySQL, React, Redux, TypeScript, Next.js, JavaScript",
  primarySkill: "Java",

  bio: "Software Development Engineer with about 2 years of experience building full-stack applications with Java, Spring Boot, React and Next.js. MCA from Christ University. Based in Bengaluru and open to relocating within India.",

  // ---------------------------------------------------------------
  // REPEATING SECTIONS ("Add Another" / "Add" buttons).
  // The filler clicks the section's Add button until there is one
  // block per entry below, then fills each block with its own entry.
  // First entry = most recent. Nothing here is ever submitted.
  // ---------------------------------------------------------------
  workExperience: [
    {
      company: "Shoffr",
      title: "Full Stack Developer",
      location: "Bengaluru",
      current: true,            // still working here: end-date fields are left alone
      startMonth: "02", startYear: "2025",
      startText: "02/2025", startISO: "2025-02-03",
      endMonth: "", endYear: "", endText: "", endISO: "",
      description: ""
    },
    {
      company: "ICIER",
      title: "Intern",
      location: "Remote",
      current: false,
      startMonth: "05", startYear: "2024",
      startText: "05/2024", startISO: "2024-05-01",
      endMonth: "07", endYear: "2024",
      endText: "07/2024", endISO: "2024-07-31",
      description: ""
    }
  ],

  education: [
    {
      school: "Christ University",
      degree: "MCA",
      fieldOfStudy: "Computer Applications",
      grade: "7.3 CGPA",
      startYear: "2023", endYear: "2025"
    },
    {
      school: "Kristu Jayanti Autonomous College",
      degree: "BCA",
      fieldOfStudy: "Computer Applications",
      grade: "8.3 CGPA",
      startYear: "2020", endYear: "2023"
    }
  ]
};
