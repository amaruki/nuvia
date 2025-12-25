export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: "video" | "article" | "quiz";
    isCompleted?: boolean;
}

export interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

export interface Review {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    rating: number;
    date: string;
    comment: string;
}

export interface Instructor {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar: string;
    signature?: string;
    coursesCount: number;
    studentsCount: number;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    longDescription?: string;
    category: string;
    level: CourseLevel;
    duration: string;
    students: number;
    rating: number;
    progress: number;
    image: string;
    color: string;
    instructor?: Instructor;
    modules?: Module[];
    reviews?: Review[];
    price?: number;
    features?: string[];
    updatedAt?: string;
}

export interface UserStat {
    label: string;
    value: string;
    icon: React.ElementType;
    change: string;
    trend: 'up' | 'down' | 'neutral';
}

export interface Certificate {
    id: string;
    courseId: number;
    courseName: string;
    issueDate: string;
    expiryDate?: string;
    grade?: string;
    instructorName: string;
    instructorSignature: string; // URL or string representation
    verificationCode: string;
    image: string; // Course image or badge
    studentName: string;
    studentEmail: string;
    status: 'active' | 'revoked';
}
