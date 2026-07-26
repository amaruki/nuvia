export interface Applicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: "New" | "Screening" | "Interview" | "Offer" | "Rejected";
  resumeUrl: string;
  coverLetter?: string;
}

export const applicants: Applicant[] = [
  {
    id: "101",
    jobId: "1", // Senior Frontend Developer
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    appliedDate: "2024-01-20",
    status: "New",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    coverLetter:
      "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Frontend Developer position at TechCorp Inc. With over 8 years of experience in building scalable web applications using React, Next.js, and TypeScript, I am confident in my ability to contribute effectively to your engineering team.\n\nIn my previous role at genericTech, I led a team of 5 developers to successfuly migrate our legacy monolith to a micro-frontend architecture, resulting in a 40% improvement in page load times and a significant boost in developer productivity. I am deeply passionate about web performance, accessibility, and creating intuitive user experiences.\n\nI have been following TechCorp's journey for years and have been impressed by your commitment to innovation, particularly in the cloud computing space. I would welcome the opportunity to discuss how my skills and experience align with your team's goals.\n\nThank you for considering my application. I look forward to the possibility of discussing this exciting opportunity with you.\n\nSincerely,\nJohn Doe",
  },
  {
    id: "102",
    jobId: "1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 987-6543",
    appliedDate: "2024-01-21",
    status: "Screening",
    resumeUrl: "#",
  },
  {
    id: "103",
    jobId: "1",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    phone: "+1 (555) 555-0123",
    appliedDate: "2024-01-19",
    status: "Interview",
    resumeUrl: "#",
  },
  {
    id: "104",
    jobId: "2", // Product Designer
    name: "Bob Brown",
    email: "bob.b@design.com",
    phone: "+1 (555) 444-5555",
    appliedDate: "2024-01-22",
    status: "New",
    resumeUrl: "#",
  },
  {
    id: "105",
    jobId: "1",
    name: "Charlie Wilson",
    email: "charlie@webdev.com",
    phone: "+1 (555) 666-7777",
    appliedDate: "2024-01-25",
    status: "Rejected",
    resumeUrl: "#",
  },
];
