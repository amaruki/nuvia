import { 
  CommitteeWorkspace, 
  WorkspaceOverallStatistics,
  WorkspaceFilterOptions,
  WorkspaceType,
  WorkspaceStatus,
  CommitteeRole,
  Permission,
  TaskStatus,
  TaskPriority,
  DiscussionStatus,
  MeetingStatus,
  DocumentStatus,
  ActivityType,
  ActivityTargetType
} from "@/types/committee.types";

export const mockWorkspaces: CommitteeWorkspace[] = [
  {
    id: "ws_1",
    committeeId: "com_1",
    name: "Executive Committee Workspace",
    description: "Central workspace for executive committee collaboration and document management",
    type: "general",
    status: "active",
    settings: {
      isPublic: false,
      allowGuestAccess: false,
      requireApproval: true,
      enableNotifications: true,
      autoArchiveDays: 365,
      maxFileSize: 50,
      allowedFileTypes: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"],
      memberPermissions: [
        {
          role: "chair",
          permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"]
        },
        {
          role: "co_chair",
          permissions: ["view", "edit", "delete", "upload", "download", "manage_members"]
        },
        {
          role: "secretary",
          permissions: ["view", "edit", "upload", "download"]
        },
        {
          role: "member",
          permissions: ["view", "download"]
        }
      ]
    },
    members: [
      {
        id: "ws_mem_1",
        userId: "user_1",
        name: "Sarah Johnson",
        email: "sarah.johnson@org.org",
        role: "chair",
        permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"],
        joinedAt: new Date("2023-01-15"),
        lastActiveAt: new Date("2025-11-30"),
        isActive: true,
        avatar: "/avatars/sarah.jpg"
      },
      {
        id: "ws_mem_2",
        userId: "user_2",
        name: "Michael Chen",
        email: "michael.chen@org.org",
        role: "co_chair",
        permissions: ["view", "edit", "delete", "upload", "download", "manage_members"],
        joinedAt: new Date("2023-03-01"),
        lastActiveAt: new Date("2025-11-29"),
        isActive: true,
        avatar: "/avatars/michael.jpg"
      },
      {
        id: "ws_mem_3",
        userId: "user_3",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@org.org",
        role: "secretary",
        permissions: ["view", "edit", "upload", "download"],
        joinedAt: new Date("2023-02-10"),
        lastActiveAt: new Date("2025-11-28"),
        isActive: true,
        avatar: "/avatars/emily.jpg"
      }
    ],
    documents: [
      {
        id: "doc_1",
        name: "2024 Strategic Plan",
        description: "Annual strategic planning document for 2024",
        fileName: "2024_strategic_plan.pdf",
        fileSize: 2048576,
        fileType: "application/pdf",
        fileUrl: "/documents/2024_strategic_plan.pdf",
        thumbnailUrl: "/thumbnails/2024_strategic_plan_thumb.jpg",
        version: 3,
        status: "approved",
        uploadedBy: "sarah.johnson@org.org",
        uploadedAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-11-20"),
        tags: ["strategic", "planning", "2024"],
        category: "Strategic Planning",
        isPublic: false,
        downloadCount: 45,
        versions: [
          {
            id: "ver_1",
            version: 1,
            fileName: "2024_strategic_plan_v1.pdf",
            fileSize: 1843200,
            fileUrl: "/documents/2024_strategic_plan_v1.pdf",
            uploadedBy: "sarah.johnson@org.org",
            uploadedAt: new Date("2024-01-15"),
            changeNotes: "Initial draft"
          },
          {
            id: "ver_2",
            version: 2,
            fileName: "2024_strategic_plan_v2.pdf",
            fileSize: 1966080,
            fileUrl: "/documents/2024_strategic_plan_v2.pdf",
            uploadedBy: "michael.chen@org.org",
            uploadedAt: new Date("2024-06-10"),
            changeNotes: "Updated financial projections"
          },
          {
            id: "ver_3",
            version: 3,
            fileName: "2024_strategic_plan_v3.pdf",
            fileSize: 2048576,
            fileUrl: "/documents/2024_strategic_plan_v3.pdf",
            uploadedBy: "sarah.johnson@org.org",
            uploadedAt: new Date("2024-11-20"),
            changeNotes: "Final version with board feedback"
          }
        ]
      },
      {
        id: "doc_2",
        name: "Meeting Minutes - November 2024",
        description: "Executive committee meeting minutes for November 2024",
        fileName: "meeting_minutes_nov_2024.docx",
        fileSize: 524288,
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileUrl: "/documents/meeting_minutes_nov_2024.docx",
        version: 1,
        status: "approved",
        uploadedBy: "emily.rodriguez@org.org",
        uploadedAt: new Date("2024-11-28"),
        updatedAt: new Date("2024-11-28"),
        tags: ["minutes", "meeting", "november"],
        category: "Meeting Records",
        isPublic: false,
        downloadCount: 12,
        versions: []
      }
    ],
    tasks: [
      {
        id: "task_1",
        title: "Review 2025 Budget Proposal",
        description: "Review and provide feedback on the 2025 budget proposal prepared by finance committee",
        status: "in_progress",
        priority: "high",
        assignedTo: ["user_1", "user_2"],
        createdBy: "user_3",
        createdAt: new Date("2025-11-20"),
        updatedAt: new Date("2025-11-28"),
        dueDate: new Date("2025-12-15"),
        tags: ["budget", "2025", "review"],
        attachments: [
          {
            id: "att_1",
            name: "2025_budget_proposal.pdf",
            fileUrl: "/attachments/2025_budget_proposal.pdf",
            fileSize: 3145728,
            uploadedBy: "user_3",
            uploadedAt: new Date("2025-11-20")
          }
        ],
        comments: [
          {
            id: "com_1",
            content: "I've reviewed the initial draft and have some concerns about the marketing allocation.",
            author: "sarah.johnson@org.org",
            createdAt: new Date("2025-11-22"),
            updatedAt: new Date("2025-11-22")
          },
          {
            id: "com_2",
            content: "Agreed. Let's schedule a meeting to discuss this further.",
            author: "michael.chen@org.org",
            createdAt: new Date("2025-11-23"),
            updatedAt: new Date("2025-11-23")
          }
        ],
        subtasks: [
          {
            id: "subtask_1",
            title: "Review revenue projections",
            status: "completed",
            priority: "medium",
            assignedTo: ["user_1"],
            createdBy: "user_3",
            createdAt: new Date("2025-11-20"),
            updatedAt: new Date("2025-11-25"),
            completedAt: new Date("2025-11-25"),
            tags: ["revenue", "projections"],
            attachments: [],
            comments: [],
            subtasks: [],
            parentTaskId: "task_1",
            estimatedHours: 4,
            actualHours: 3
          },
          {
            id: "subtask_2",
            title: "Analyze expense categories",
            status: "in_progress",
            priority: "medium",
            assignedTo: ["user_2"],
            createdBy: "user_3",
            createdAt: new Date("2025-11-20"),
            updatedAt: new Date("2025-11-28"),
            dueDate: new Date("2025-12-10"),
            tags: ["expenses", "analysis"],
            attachments: [],
            comments: [],
            subtasks: [],
            parentTaskId: "task_1",
            estimatedHours: 6,
            actualHours: 4
          }
        ],
        estimatedHours: 12,
        actualHours: 7
      },
      {
        id: "task_2",
        title: "Prepare Board Presentation",
        description: "Create presentation for upcoming board meeting on Q4 performance",
        status: "todo",
        priority: "urgent",
        assignedTo: ["user_3"],
        createdBy: "user_1",
        createdAt: new Date("2025-11-25"),
        updatedAt: new Date("2025-11-25"),
        dueDate: new Date("2025-12-08"),
        tags: ["presentation", "board", "q4"],
        attachments: [],
        comments: [],
        subtasks: [],
        estimatedHours: 8,
        actualHours: 0
      }
    ],
    discussions: [
      {
        id: "disc_1",
        title: "2025 Strategic Initiatives Discussion",
        content: "Let's discuss the key strategic initiatives for 2025. I've prepared a draft list based on our previous meetings and current organizational priorities.",
        category: "Strategic Planning",
        status: "active",
        author: "sarah.johnson@org.org",
        createdAt: new Date("2025-11-15"),
        updatedAt: new Date("2025-11-28"),
        tags: ["strategic", "2025", "initiatives"],
        isPinned: true,
        isLocked: false,
        viewCount: 67,
        replyCount: 12,
        lastReplyAt: new Date("2025-11-28"),
        lastReplyBy: "michael.chen@org.org",
        replies: [
          {
            id: "reply_1",
            content: "Great starting point! I think we should also consider digital transformation as a key initiative.",
            author: "michael.chen@org.org",
            createdAt: new Date("2025-11-16"),
            updatedAt: new Date("2025-11-16"),
            attachments: [],
            reactions: [
              {
                id: "react_1",
                emoji: "👍",
                userId: "user_3",
                createdAt: new Date("2025-11-16")
              }
            ]
          },
          {
            id: "reply_2",
            content: "I agree with Michael. Digital transformation should be a priority given the current market trends.",
            author: "emily.rodriguez@org.org",
            createdAt: new Date("2025-11-17"),
            updatedAt: new Date("2025-11-17"),
            attachments: [],
            reactions: []
          }
        ],
        attachments: [
          {
            id: "disc_att_1",
            name: "2025_strategic_initiatives_draft.pdf",
            fileUrl: "/attachments/2025_strategic_initiatives_draft.pdf",
            fileSize: 1048576,
            uploadedBy: "sarah.johnson@org.org",
            uploadedAt: new Date("2025-11-15")
          }
        ],
        reactions: [
          {
            id: "react_2",
            emoji: "🎯",
            userId: "user_2",
            createdAt: new Date("2025-11-15")
          },
          {
            id: "react_3",
            emoji: "💡",
            userId: "user_3",
            createdAt: new Date("2025-11-16")
          }
        ]
      }
    ],
    meetings: [
      {
        id: "meet_1",
        title: "Executive Committee Meeting - December 2024",
        description: "Monthly executive committee meeting to discuss strategic initiatives and budget planning",
        startTime: new Date("2024-12-05T14:00:00Z"),
        endTime: new Date("2024-12-05T16:00:00Z"),
        location: "Executive Boardroom",
        isVirtual: false,
        status: "completed",
        organizer: "sarah.johnson@org.org",
        attendees: [
          {
            id: "att_1",
            userId: "user_1",
            name: "Sarah Johnson",
            email: "sarah.johnson@org.org",
            role: "organizer",
            status: "attended",
            joinedAt: new Date("2024-12-05T13:55:00Z"),
            leftAt: new Date("2024-12-05T16:05:00Z")
          },
          {
            id: "att_2",
            userId: "user_2",
            name: "Michael Chen",
            email: "michael.chen@org.org",
            role: "attendee",
            status: "attended",
            joinedAt: new Date("2024-12-05T13:58:00Z"),
            leftAt: new Date("2024-12-05T16:02:00Z")
          },
          {
            id: "att_3",
            userId: "user_3",
            name: "Emily Rodriguez",
            email: "emily.rodriguez@org.org",
            role: "attendee",
            status: "attended",
            joinedAt: new Date("2024-12-05T13:57:00Z"),
            leftAt: new Date("2024-12-05T16:00:00Z")
          }
        ],
        agenda: [
          {
            id: "agenda_1",
            title: "Welcome and Introductions",
            description: "Brief welcome and introductions for any new attendees",
            duration: 5,
            presenter: "Sarah Johnson",
            order: 1,
            isCompleted: true,
            notes: "All attendees introduced"
          },
          {
            id: "agenda_2",
            title: "Q4 Performance Review",
            description: "Review of Q4 2024 performance metrics and achievements",
            duration: 30,
            presenter: "Michael Chen",
            order: 2,
            isCompleted: true,
            notes: "Positive performance across all key metrics"
          },
          {
            id: "agenda_3",
            title: "2025 Budget Discussion",
            description: "Review and discussion of proposed 2025 budget",
            duration: 45,
            presenter: "Sarah Johnson",
            order: 3,
            isCompleted: true,
            notes: "Budget approved with minor adjustments"
          },
          {
            id: "agenda_4",
            title: "Strategic Initiatives Planning",
            description: "Discussion of key strategic initiatives for 2025",
            duration: 30,
            presenter: "Emily Rodriguez",
            order: 4,
            isCompleted: true,
            notes: "Three key initiatives identified and prioritized"
          },
          {
            id: "agenda_5",
            title: "Action Items and Next Steps",
            description: "Review of action items and assignment of responsibilities",
            duration: 10,
            presenter: "Sarah Johnson",
            order: 5,
            isCompleted: true,
            notes: "Action items assigned to respective committee members"
          }
        ],
        minutes: "The executive committee meeting was held on December 5, 2024. All key agenda items were discussed and decisions were made regarding the 2025 budget and strategic initiatives. Action items were assigned and follow-up meetings were scheduled.",
        attachments: [
          {
            id: "meet_att_1",
            name: "meeting_agenda_dec_2024.pdf",
            fileUrl: "/attachments/meeting_agenda_dec_2024.pdf",
            fileSize: 524288,
            uploadedBy: "emily.rodriguez@org.org",
            uploadedAt: new Date("2024-12-03"),
            type: "agenda"
          },
          {
            id: "meet_att_2",
            name: "q4_performance_report.pdf",
            fileUrl: "/attachments/q4_performance_report.pdf",
            fileSize: 1572864,
            uploadedBy: "michael.chen@org.org",
            uploadedAt: new Date("2024-12-04"),
            type: "presentation"
          }
        ],
        createdAt: new Date("2024-11-20"),
        updatedAt: new Date("2024-12-06")
      }
    ],
    activity: [
      {
        id: "act_1",
        type: "document_uploaded",
        actor: "emily.rodriguez@org.org",
        target: "Meeting Minutes - November 2024",
        targetType: "document",
        description: "uploaded document 'Meeting Minutes - November 2024'",
        metadata: {
          documentId: "doc_2",
          fileSize: 524288
        },
        createdAt: new Date("2024-11-28")
      },
      {
        id: "act_2",
        type: "task_created",
        actor: "emily.rodriguez@org.org",
        target: "Review 2025 Budget Proposal",
        targetType: "task",
        description: "created task 'Review 2025 Budget Proposal'",
        metadata: {
          taskId: "task_1",
          priority: "high",
          dueDate: new Date("2025-12-15")
        },
        createdAt: new Date("2025-11-20")
      },
      {
        id: "act_3",
        type: "discussion_started",
        actor: "sarah.johnson@org.org",
        target: "2025 Strategic Initiatives Discussion",
        targetType: "discussion",
        description: "started discussion '2025 Strategic Initiatives Discussion'",
        metadata: {
          discussionId: "disc_1",
          category: "Strategic Planning"
        },
        createdAt: new Date("2025-11-15")
      },
      {
        id: "act_4",
        type: "meeting_completed",
        actor: "sarah.johnson@org.org",
        target: "Executive Committee Meeting - December 2024",
        targetType: "meeting",
        description: "completed meeting 'Executive Committee Meeting - December 2024'",
        metadata: {
          meetingId: "meet_1",
          attendeeCount: 3,
          duration: 120
        },
        createdAt: new Date("2024-12-06")
      }
    ],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2025-11-30"),
    createdBy: "admin@example.com",
    updatedBy: "sarah.johnson@org.org"
  },
  {
    id: "ws_2",
    committeeId: "com_2",
    name: "Finance Committee Workspace",
    description: "Collaborative workspace for finance committee budget management and financial planning",
    type: "project",
    status: "active",
    settings: {
      isPublic: false,
      allowGuestAccess: false,
      requireApproval: true,
      enableNotifications: true,
      autoArchiveDays: 365,
      maxFileSize: 25,
      allowedFileTypes: [".pdf", ".xls", ".xlsx", ".csv"],
      memberPermissions: [
        {
          role: "chair",
          permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"]
        },
        {
          role: "treasurer",
          permissions: ["view", "edit", "upload", "download"]
        },
        {
          role: "member",
          permissions: ["view", "download"]
        }
      ]
    },
    members: [
      {
        id: "ws_mem_4",
        userId: "user_6",
        name: "Robert Thompson",
        email: "robert.thompson@org.org",
        role: "chair",
        permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"],
        joinedAt: new Date("2023-06-01"),
        lastActiveAt: new Date("2025-11-29"),
        isActive: true,
        avatar: "/avatars/robert.jpg"
      },
      {
        id: "ws_mem_5",
        userId: "user_7",
        name: "Amanda Wilson",
        email: "amanda.wilson@org.org",
        role: "treasurer",
        permissions: ["view", "edit", "upload", "download"],
        joinedAt: new Date("2023-07-15"),
        lastActiveAt: new Date("2025-11-28"),
        isActive: true,
        avatar: "/avatars/amanda.jpg"
      }
    ],
    documents: [
      {
        id: "doc_3",
        name: "2025 Budget Proposal",
        description: "Detailed budget proposal for fiscal year 2025",
        fileName: "2025_budget_proposal.xlsx",
        fileSize: 3145728,
        fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileUrl: "/documents/2025_budget_proposal.xlsx",
        version: 2,
        status: "review",
        uploadedBy: "robert.thompson@org.org",
        uploadedAt: new Date("2025-11-10"),
        updatedAt: new Date("2025-11-25"),
        tags: ["budget", "2025", "proposal"],
        category: "Budget Planning",
        isPublic: false,
        downloadCount: 8,
        versions: [
          {
            id: "ver_4",
            version: 1,
            fileName: "2025_budget_proposal_v1.xlsx",
            fileSize: 2936012,
            fileUrl: "/documents/2025_budget_proposal_v1.xlsx",
            uploadedBy: "robert.thompson@org.org",
            uploadedAt: new Date("2025-11-10"),
            changeNotes: "Initial draft"
          },
          {
            id: "ver_5",
            version: 2,
            fileName: "2025_budget_proposal_v2.xlsx",
            fileSize: 3145728,
            fileUrl: "/documents/2025_budget_proposal_v2.xlsx",
            uploadedBy: "amanda.wilson@org.org",
            uploadedAt: new Date("2025-11-25"),
            changeNotes: "Updated with executive committee feedback"
          }
        ]
      }
    ],
    tasks: [
      {
        id: "task_3",
        title: "Finalize Q4 Financial Report",
        description: "Complete the Q4 financial report for board presentation",
        status: "in_progress",
        priority: "high",
        assignedTo: ["user_7"],
        createdBy: "user_6",
        createdAt: new Date("2025-11-15"),
        updatedAt: new Date("2025-11-28"),
        dueDate: new Date("2025-12-05"),
        tags: ["financial", "report", "q4"],
        attachments: [],
        comments: [],
        subtasks: [],
        estimatedHours: 10,
        actualHours: 6
      }
    ],
    discussions: [
      {
        id: "disc_2",
        title: "Investment Strategy Review",
        content: "We need to review our current investment strategy and make recommendations for 2025. Please share your thoughts on the current portfolio performance.",
        category: "Financial Planning",
        status: "active",
        author: "robert.thompson@org.org",
        createdAt: new Date("2025-11-18"),
        updatedAt: new Date("2025-11-27"),
        tags: ["investment", "strategy", "2025"],
        isPinned: false,
        isLocked: false,
        viewCount: 23,
        replyCount: 5,
        lastReplyAt: new Date("2025-11-27"),
        lastReplyBy: "amanda.wilson@org.org",
        replies: [
          {
            id: "reply_3",
            content: "I've analyzed the current portfolio and we're underperforming in the tech sector. I recommend rebalancing.",
            author: "amanda.wilson@org.org",
            createdAt: new Date("2025-11-20"),
            updatedAt: new Date("2025-11-20"),
            attachments: [],
            reactions: []
          }
        ],
        attachments: [
          {
            id: "disc_att_2",
            name: "portfolio_analysis_q4.pdf",
            fileUrl: "/attachments/portfolio_analysis_q4.pdf",
            fileSize: 838860,
            uploadedBy: "robert.thompson@org.org",
            uploadedAt: new Date("2025-11-18")
          }
        ],
        reactions: []
      }
    ],
    meetings: [
      {
        id: "meet_2",
        title: "Budget Review Meeting",
        description: "Review of 2025 budget proposal and financial planning",
        startTime: new Date("2025-11-25T15:00:00Z"),
        endTime: new Date("2025-11-25T16:30:00Z"),
        location: "Finance Conference Room",
        isVirtual: false,
        status: "completed",
        organizer: "robert.thompson@org.org",
        attendees: [
          {
            id: "att_4",
            userId: "user_6",
            name: "Robert Thompson",
            email: "robert.thompson@org.org",
            role: "organizer",
            status: "attended",
            joinedAt: new Date("2025-11-25T14:55:00Z"),
            leftAt: new Date("2025-11-25T16:35:00Z")
          },
          {
            id: "att_5",
            userId: "user_7",
            name: "Amanda Wilson",
            email: "amanda.wilson@org.org",
            role: "attendee",
            status: "attended",
            joinedAt: new Date("2025-11-25T14:58:00Z"),
            leftAt: new Date("2025-11-25T16:30:00Z")
          }
        ],
        agenda: [
          {
            id: "agenda_6",
            title: "Budget Overview",
            description: "Review of overall budget structure and allocations",
            duration: 30,
            presenter: "Robert Thompson",
            order: 1,
            isCompleted: true,
            notes: "Budget structure reviewed and approved"
          },
          {
            id: "agenda_7",
            title: "Departmental Breakdown",
            description: "Detailed review of departmental budget allocations",
            duration: 45,
            presenter: "Amanda Wilson",
            order: 2,
            isCompleted: true,
            notes: "Adjustments made to marketing and IT allocations"
          }
        ],
        minutes: "Budget review meeting completed successfully. Key decisions made regarding departmental allocations for 2025.",
        attachments: [
          {
            id: "meet_att_3",
            name: "budget_presentation.pdf",
            fileUrl: "/attachments/budget_presentation.pdf",
            fileSize: 2097152,
            uploadedBy: "robert.thompson@org.org",
            uploadedAt: new Date("2025-11-24"),
            type: "presentation"
          }
        ],
        createdAt: new Date("2025-11-20"),
        updatedAt: new Date("2025-11-26")
      }
    ],
    activity: [
      {
        id: "act_5",
        type: "document_uploaded",
        actor: "amanda.wilson@org.org",
        target: "2025 Budget Proposal",
        targetType: "document",
        description: "uploaded document '2025 Budget Proposal'",
        metadata: {
          documentId: "doc_3",
          fileSize: 3145728
        },
        createdAt: new Date("2025-11-25")
      },
      {
        id: "act_6",
        type: "task_created",
        actor: "robert.thompson@org.org",
        target: "Finalize Q4 Financial Report",
        targetType: "task",
        description: "created task 'Finalize Q4 Financial Report'",
        metadata: {
          taskId: "task_3",
          priority: "high",
          dueDate: new Date("2025-12-05")
        },
        createdAt: new Date("2025-11-15")
      }
    ],
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2025-11-29"),
    createdBy: "admin@example.com",
    updatedBy: "robert.thompson@org.org"
  },
  {
    id: "ws_3",
    committeeId: "com_3",
    name: "Membership Committee Workspace",
    description: "Workspace for membership committee activities and member engagement initiatives",
    type: "document",
    status: "active",
    settings: {
      isPublic: true,
      allowGuestAccess: true,
      requireApproval: false,
      enableNotifications: true,
      autoArchiveDays: 180,
      maxFileSize: 10,
      allowedFileTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"],
      memberPermissions: [
        {
          role: "chair",
          permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"]
        },
        {
          role: "member",
          permissions: ["view", "upload", "download"]
        }
      ]
    },
    members: [
      {
        id: "ws_mem_6",
        userId: "user_9",
        name: "Lisa Anderson",
        email: "lisa.anderson@org.org",
        role: "chair",
        permissions: ["view", "edit", "delete", "upload", "download", "manage_members", "manage_settings"],
        joinedAt: new Date("2023-09-01"),
        lastActiveAt: new Date("2025-11-30"),
        isActive: true,
        avatar: "/avatars/lisa.jpg"
      }
    ],
    documents: [
      {
        id: "doc_4",
        name: "Membership Benefits Guide",
        description: "Comprehensive guide to membership benefits and perks",
        fileName: "membership_benefits_guide.pdf",
        fileSize: 1048576,
        fileType: "application/pdf",
        fileUrl: "/documents/membership_benefits_guide.pdf",
        version: 1,
        status: "approved",
        uploadedBy: "lisa.anderson@org.org",
        uploadedAt: new Date("2025-10-15"),
        updatedAt: new Date("2025-10-15"),
        tags: ["membership", "benefits", "guide"],
        category: "Member Resources",
        isPublic: true,
        downloadCount: 156,
        versions: []
      }
    ],
    tasks: [
      {
        id: "task_4",
        title: "Plan Q1 Membership Drive",
        description: "Organize and execute Q1 2025 membership drive campaign",
        status: "todo",
        priority: "medium",
        assignedTo: ["user_9"],
        createdBy: "user_9",
        createdAt: new Date("2025-11-20"),
        updatedAt: new Date("2025-11-20"),
        dueDate: new Date("2026-01-15"),
        tags: ["membership", "drive", "q1"],
        attachments: [],
        comments: [],
        subtasks: [],
        estimatedHours: 20,
        actualHours: 0
      }
    ],
    discussions: [],
    meetings: [],
    activity: [
      {
        id: "act_7",
        type: "document_uploaded",
        actor: "lisa.anderson@org.org",
        target: "Membership Benefits Guide",
        targetType: "document",
        description: "uploaded document 'Membership Benefits Guide'",
        metadata: {
          documentId: "doc_4",
          fileSize: 1048576
        },
        createdAt: new Date("2025-10-15")
      }
    ],
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2025-11-30"),
    createdBy: "admin@example.com",
    updatedBy: "lisa.anderson@org.org"
  }
];

export const mockWorkspaceStatistics: WorkspaceOverallStatistics = {
  totalWorkspaces: 3,
  activeWorkspaces: 3,
  archivedWorkspaces: 0,
  lockedWorkspaces: 0,
  totalMembers: 6,
  averageMembersPerWorkspace: 2.0,
  totalDocuments: 4,
  totalTasks: 4,
  totalDiscussions: 2,
  totalMeetings: 2,
  documentUploadRate: 85.5,
  taskCompletionRate: 65.0,
  meetingAttendanceRate: 92.3,
  topActiveWorkspaces: [
    {
      workspaceId: "ws_1",
      workspaceName: "Executive Committee Workspace",
      type: "general",
      memberCount: 3,
      documentCount: 2,
      taskCount: 2,
      discussionCount: 1,
      meetingCount: 1,
      activityScore: 92.5,
      engagementRate: 88.7
    },
    {
      workspaceId: "ws_2",
      workspaceName: "Finance Committee Workspace",
      type: "project",
      memberCount: 2,
      documentCount: 1,
      taskCount: 1,
      discussionCount: 1,
      meetingCount: 1,
      activityScore: 78.3,
      engagementRate: 82.1
    },
    {
      workspaceId: "ws_3",
      workspaceName: "Membership Committee Workspace",
      type: "document",
      memberCount: 1,
      documentCount: 1,
      taskCount: 1,
      discussionCount: 0,
      meetingCount: 0,
      activityScore: 65.0,
      engagementRate: 75.5
    }
  ],
  typeBreakdown: [
    {
      type: "general",
      workspaceCount: 1,
      memberCount: 3,
      documentCount: 2,
      taskCount: 2,
      averageActivityScore: 92.5
    },
    {
      type: "project",
      workspaceCount: 1,
      memberCount: 2,
      documentCount: 1,
      taskCount: 1,
      averageActivityScore: 78.3
    },
    {
      type: "document",
      workspaceCount: 1,
      memberCount: 1,
      documentCount: 1,
      taskCount: 1,
      averageActivityScore: 65.0
    }
  ],
  monthlyTrend: [
    { month: "Nov 2025", workspaceCount: 3, memberCount: 6, documentCount: 4, taskCount: 4, discussionCount: 2, meetingCount: 2 },
    { month: "Oct 2025", workspaceCount: 3, memberCount: 6, documentCount: 3, taskCount: 3, discussionCount: 1, meetingCount: 1 },
    { month: "Sep 2025", workspaceCount: 3, memberCount: 6, documentCount: 2, taskCount: 2, discussionCount: 1, meetingCount: 1 }
  ]
};