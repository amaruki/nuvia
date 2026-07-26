export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  status: "Active" | "Closed" | "Draft";
  applicants: number;
  postedDate: string;
  salary: string;
  description: string;
}

export const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    status: "Active",
    applicants: 45,
    postedDate: "2024-01-15",
    salary: "$120k - $160k",
    description: "We are looking for an experienced Frontend Developer to join our team...",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Design Studio",
    location: "Remote",
    type: "Contract",
    status: "Active",
    applicants: 28,
    postedDate: "2024-01-18",
    salary: "$80k - $120k",
    description: "Seeking a creative Product Designer...",
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "DataSystems",
    location: "New York, NY",
    type: "Full-time",
    status: "Closed",
    applicants: 12,
    postedDate: "2023-12-20",
    salary: "$130k - $170k",
    description: "Join our backend team to build scalable systems...",
  },
  {
    id: "4",
    title: "Marketing Manager",
    company: "Growth Hacking Co.",
    location: "Chicago, IL",
    type: "Full-time",
    status: "Draft",
    applicants: 0,
    postedDate: "2024-01-20",
    salary: "$90k - $110k",
    description: "We need a marketing wizard...",
  },
  {
    id: "5",
    title: "Customer Support Specialist",
    company: "HelpDesk",
    location: "Remote",
    type: "Part-time",
    status: "Active",
    applicants: 89,
    postedDate: "2024-01-10",
    salary: "$20/hr",
    description: "Assist customers with their inquiries...",
  },
];
