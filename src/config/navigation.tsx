import {
    Home,
    Calendar,
    Library,
    ClipboardList,
    type LucideIcon,
    MessageSquare
} from 'lucide-react';

export interface SubmenuItem {
    label: string;
    path: string;
    icon?: LucideIcon;
    color?: 'red' | 'blue' | 'amber' | 'purple' | 'emerald';
}

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    hasSubmenu?: boolean;
    submenuItems?: SubmenuItem[];
}

export const navigationConfig: NavItem[] = [
    { label: 'Trang chủ', path: '/', icon: Home },
    {
        label: 'Lịch học',
        path: '/lich-hoc',
        icon: Calendar,
    },
    {
        label: 'Các khóa học',
        path: '/courses',
        icon: Library,
    },

    {
        label: 'Bài kiểm tra',
        path: '/bai-kiem-tra',
        icon: ClipboardList,
    },

    {
        label: 'Diễn đàn / Hỏi đáp',
        path: '/forum',
        icon: MessageSquare,
    },
];
