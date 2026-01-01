
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
        resumeUrl: "#",
        coverLetter: "I am very interested in this role..."
    },
    {
        id: "102",
        jobId: "1",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1 (555) 987-6543",
        appliedDate: "2024-01-21",
        status: "Screening",
        resumeUrl: "#"
    },
    {
        id: "103",
        jobId: "1",
        name: "Alice Johnson",
        email: "alice.j@example.com",
        phone: "+1 (555) 555-0123",
        appliedDate: "2024-01-19",
        status: "Interview",
        resumeUrl: "#"
    },
    {
        id: "104",
        jobId: "2", // Product Designer
        name: "Bob Brown",
        email: "bob.b@design.com",
        phone: "+1 (555) 444-5555",
        appliedDate: "2024-01-22",
        status: "New",
        resumeUrl: "#"
    },
    {
        id: "105",
        jobId: "1",
        name: "Charlie Wilson",
        email: "charlie@webdev.com",
        phone: "+1 (555) 666-7777",
        appliedDate: "2024-01-25",
        status: "Rejected",
        resumeUrl: "#"
    }
];
