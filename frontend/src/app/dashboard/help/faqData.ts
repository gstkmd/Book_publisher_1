export interface FAQItem {
    question: string;
    answer: string;
    category: 'Tasks' | 'Library' | 'Workflow';
    tags: string[];
}

export const faqData: FAQItem[] = [
    // TASKS
    {
        category: 'Tasks',
        question: 'How do I create a new task?',
        answer: 'Navigate to the "Tasks" section and click the "Create Task" button. Enter a descriptive title, set the priority, and assign it to a team member if needed. You can also add descriptions and due dates to keep things organized.',
        tags: ['create', 'new task', 'add', 'assignment']
    },
    {
        category: 'Tasks',
        question: 'How does task assignment work?',
        answer: 'When creating or editing a task, you can select an "Assignee" from your organization\'s team member list. The assignee will receive a notification and see the task in their personal "My Tasks" view.',
        tags: ['assign', 'member', 'team', 'who']
    },
    {
        category: 'Tasks',
        question: 'What do the different task statuses mean?',
        answer: '"To Do" is for tasks that haven\'t started yet. "In Progress" means someone is actively working on it (the system tracks time in this stage). "Done" or "Completed" signifies the work is finished.',
        tags: ['status', 'to do', 'progress', 'done', 'stage']
    },
    {
        category: 'Tasks',
        question: 'Can I reassign a task that is already in progress?',
        answer: 'Yes! Simply open the task detail, click the assignee name, and select a different team member. The task history will log this change for accountability.',
        tags: ['reassign', 'change member', 'move task']
    },

    // LIBRARY
    {
        category: 'Library',
        question: 'What is the Library used for?',
        answer: 'The Library is your central repository for all content, including documents, drafts, and assets. It allows for version control and collaborative editing before a piece moves into the final workflow.',
        tags: ['library', 'storage', 'content', 'what is']
    },
    {
        category: 'Library',
        question: 'How do I upload files to the Library?',
        answer: 'In the Library view, use the "Upload" or "New Content" buttons. You can upload local files or create new digital documents directly within the platform using our collaborative editor.',
        tags: ['upload', 'add content', 'new document']
    },
    {
        category: 'Library',
        question: 'How do I find a specific document in the Library?',
        answer: 'Use the search bar at the top of the Library page. You can search by title, tags, or even content type to quickly locate your assets.',
        tags: ['search', 'find', 'filter', 'locate']
    },

    // WORKFLOW
    {
        category: 'Workflow',
        question: 'How does the content review workflow work?',
        answer: 'Content moves through stages: Draft -> Review -> Approved -> Published. Once a writer finishes a draft, they can share it for review, which automatically creates a task for the designated reviewer.',
        tags: ['workflow', 'review', 'stages', 'approval']
    },
    {
        category: 'Workflow',
        question: 'Who can approve content for publishing?',
        answer: 'Typically, users with "Admin" or "Editor" roles have the authority to move content to the "Approved" or "Published" stages. This ensures quality control across all publications.',
        tags: ['approve', 'publish', 'roles', 'permissions']
    }
];
