import { BookOpen, Clock, Trophy, Zap } from "lucide-react";
import { Course, UserStat, Certificate } from "../_types";

export const courses: Course[] = [
    {
        id: 1,
        title: "Advanced React Patterns",
        description: "Master advanced React concepts including HoCs, Render Props, and Custom Hooks.",
        longDescription: "Take your React skills to the next level with this comprehensive course on advanced design patterns. You'll learn how to build reusable, resilient, and scalable components using industry-standard techniques. We cover everything from Higher-Order Components and Render Props to the latest Compound Components pattern and Custom Hooks.",
        category: "Development",
        level: "Advanced",
        duration: "6h 30m",
        students: 1245,
        rating: 4.8,
        progress: 75,
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-blue-500/20 to-cyan-500/20",
        features: ["Source code included", "Lifetime access", "Certificate of completion", "Mobile friendly"],
        updatedAt: "March 2024",
        instructor: {
            id: "inst-1",
            name: "Sarah drasner",
            role: "Senior Frontend Engineer",
            bio: "Sarah is a Core Team member of Vue.js and a Staff Writer at CSS-Tricks. She loves teaching and building tools for developers.",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
            signature: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png",
            coursesCount: 12,
            studentsCount: 45000
        },
        modules: [
            {
                id: "m1",
                title: "Introduction to Advanced Patterns",
                lessons: [
                    { id: "l1", title: "Why Design Patterns Matter", duration: "10:00", type: "video", isCompleted: true },
                    { id: "l2", title: "React Rendering Behavior", duration: "15:30", type: "video", isCompleted: true }
                ]
            },
            {
                id: "m2",
                title: "Compound Components",
                lessons: [
                    { id: "l3", title: "The Problem with Prop Drilling", duration: "12:00", type: "video", isCompleted: true },
                    { id: "l4", title: "Building Flexible Compound Components", duration: "25:00", type: "video", isCompleted: true },
                    { id: "l5", title: "Context API & Compound Components", duration: "20:00", type: "video", isCompleted: false },
                    { id: "l5-quiz", title: "Compound Components Quiz", duration: "5:00", type: "quiz", isCompleted: false }
                ]
            },
            {
                id: "m3",
                title: "Control Props Pattern",
                lessons: [
                    { id: "l6", title: "Controlled vs Uncontrolled", duration: "18:00", type: "video", isCompleted: false }
                ]
            }
        ],
        reviews: [
            {
                id: "r1",
                user: { name: "Alex Chen", avatar: "https://github.com/shadcn.png" },
                rating: 5,
                date: "2 days ago",
                comment: "This course completely changed how I think about component composition. Highly recommended!"
            },
            {
                id: "r2",
                user: { name: "Maria Garcia", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100" },
                rating: 4,
                date: "1 week ago",
                comment: "Great content, but I wish there were more TypeScript examples."
            }
        ]
    },
    {
        id: 2,
        title: "UI/UX Design Fundamentals",
        description: "Learn the core principles of user interface and user experience design.",
        category: "Design",
        level: "Beginner",
        duration: "4h 15m",
        students: 890,
        rating: 4.9,
        progress: 30,
        image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d4f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-purple-500/20 to-pink-500/20"
    },
    {
        id: 3,
        title: "Node.js Microservices",
        description: "Build scalable microservices architecture using Node.js and Docker.",
        category: "Backend",
        level: "Intermediate",
        duration: "8h 45m",
        students: 650,
        rating: 4.7,
        progress: 0,
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-green-500/20 to-emerald-500/20"
    },
    {
        id: 4,
        title: "Data Science with Python",
        description: "Comprehensive guide to data analysis, visualization and machine learning.",
        category: "Data Science",
        level: "Intermediate",
        duration: "12h 10m",
        students: 2100,
        rating: 4.6,
        progress: 10,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-yellow-500/20 to-orange-500/20"
    },
    {
        id: 5,
        title: "Cloud Security Essentials",
        description: "Best practices for securing cloud infrastructure and applications.",
        category: "Security",
        level: "Advanced",
        duration: "5h 20m",
        students: 450,
        rating: 4.9,
        progress: 0,
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-red-500/20 to-rose-500/20"
    },
    {
        id: 6,
        title: "GraphQL for Modern Apps",
        description: "Learn how to build efficient APIs using GraphQL and Apollo.",
        category: "Development",
        level: "Intermediate",
        duration: "4h 50m",
        students: 780,
        rating: 4.5,
        progress: 0,
        image: "https://images.unsplash.com/photo-1667372393119-c85c020799a3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        color: "from-indigo-500/20 to-violet-500/20"
    }
];

export const stats: UserStat[] = [
    { label: "Courses in Progress", value: "3", icon: BookOpen, change: "+1 this week", trend: "up" },
    { label: "Hours Learned", value: "24.5", icon: Clock, change: "+4.2 hrs", trend: "up" },
    { label: "Certificates Earned", value: "5", icon: Trophy, change: "Last earned 2d ago", trend: "neutral" },
    { label: "Current Streak", value: "7 Days", icon: Zap, change: "Best: 12 days", trend: "up" },
];

export const certificates: Certificate[] = [
    {
        id: "cert-001",
        courseId: 1,
        courseName: "Advanced React Patterns",
        issueDate: "March 15, 2024",
        instructorName: "Sarah Drasner",
        instructorSignature: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png",
        verificationCode: "REACT-ADV-2024-8892",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        studentName: "Alex Chen",
        studentEmail: "alex.chen@example.com",
        status: "active"
    },
    {
        id: "cert-002",
        courseId: 2,
        courseName: "UI/UX Design Fundamentals",
        issueDate: "February 28, 2024",
        instructorName: "Gary Simon",
        instructorSignature: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png",
        verificationCode: "UIUX-BAS-2024-1123",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d4f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        studentName: "Alex Chen",
        studentEmail: "alex.chen@example.com",
        status: "active"
    }
];
