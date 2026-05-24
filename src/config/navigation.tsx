import {
    Home,
    Library,
    Target,
    MessageSquare,
    Calendar,
    Map,
    type LucideIcon,
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
    roles?: ('STUDENT' | 'TEACHER' | 'ADMIN')[];
    isCta?: boolean;
}

export const navigationConfig: NavItem[] = [
    { label: 'Trang chủ', path: '/', icon: Home },
    {
        label: 'Khóa học',
        path: '/courses',
        icon: Library,
        hasSubmenu: true,
    },
    {
        label: 'Lộ trình',
        path: '/my-path',
        icon: Map,
        roles: ['STUDENT'],
    },
    {
        label: 'Lịch học',
        path: '/lich-hoc',
        icon: Calendar,
        roles: ['STUDENT', 'TEACHER', 'ADMIN'],
    },
    {
        label: 'Diễn đàn',
        path: '/forum',
        icon: MessageSquare,
    },
];

// CTA riêng cho Placement Test - hiển thị nổi bật trong header
export const placementTestCta = {
    label: 'Kiểm tra trình độ',
    path: '/#personalized-path',
    icon: Target,
};
