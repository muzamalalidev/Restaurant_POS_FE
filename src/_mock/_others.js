import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const _carouselsMembers = Array.from({ length: 6 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  role: _mock.role(index),
  avatarUrl: _mock.image.portrait(index),
}));

// ----------------------------------------------------------------------

export const _faqs = [
  {
    id: 'faq-1',
    value: 'panel1',
    title: 'What is Minimal Dashboard?',
    content: 'Minimal Dashboard is a production-ready theme built with Next.js and Material UI. It provides a comprehensive set of components, layouts, and pages to help you build modern web applications quickly.',
  },
  {
    id: 'faq-2',
    value: 'panel2',
    title: 'What technologies does this theme use?',
    content: 'The theme is built with Next.js 15, Material UI (MUI) v6, Emotion for styling, Framer Motion for animations, React Hook Form with Zod for form validation, and many more modern libraries.',
  },
  {
    id: 'faq-3',
    value: 'panel3',
    title: 'Does this theme support dark mode?',
    content: 'Yes. The theme includes a complete dark mode implementation with smooth transitions. You can toggle between light and dark modes using the settings drawer, and the preference is persisted across sessions.',
  },
  {
    id: 'faq-4',
    value: 'panel4',
    title: 'Can I customize the theme colors and typography?',
    content: 'Absolutely. The theme system is fully customizable through the theme configuration files. You can modify the color palette, typography, shadows, and component overrides to match your brand identity.',
  },
  {
    id: 'faq-5',
    value: 'panel5',
    title: 'Does this theme support internationalization (i18n)?',
    content: 'Yes. The theme includes built-in support for multiple languages with an i18n provider. You can easily add new languages and switch between them using the language selector.',
  },
  {
    id: 'faq-6',
    value: 'panel6',
    title: 'What layout options are available?',
    content: 'The theme provides multiple layout options including a main marketing layout, a dashboard layout with vertical and mini navigation, and authentication page layouts with centered and split variants.',
  },
  {
    id: 'faq-7',
    value: 'panel7',
    title: 'How do I get started with this theme?',
    content: 'Simply clone the repository, install dependencies with npm or yarn, and run the development server. The theme is ready to use out of the box with example pages and components.',
  },
  {
    id: 'faq-8',
    value: 'panel8',
    title: 'Is this theme production-ready?',
    content: 'Yes. The theme is optimized for production with proper code splitting, image optimization, and performance best practices. It also includes ESLint and Prettier configurations for code quality.',
  },
  {
    id: 'faq-9',
    value: 'panel9',
    title: 'What authentication methods are supported?',
    content: 'The theme includes demo authentication flows for JWT, Auth0, Firebase, Supabase, and AWS Amplify. These serve as UI examples that you can connect to your preferred authentication provider.',
  },
  {
    id: 'faq-10',
    value: 'panel10',
    title: 'Can I use this theme for commercial projects?',
    content: 'Yes. The theme is licensed for commercial use. You can use it to build client projects, SaaS applications, admin dashboards, and any other web application.',
  },
];

// ----------------------------------------------------------------------

export const _addressBooks = Array.from({ length: 24 }, (_, index) => ({
  id: _mock.id(index),
  primary: index === 0,
  name: _mock.fullName(index),
  email: _mock.email(index + 1),
  fullAddress: _mock.fullAddress(index),
  phoneNumber: _mock.phoneNumber(index),
  company: _mock.companyNames(index + 1),
  addressType: index === 0 ? 'Home' : 'Office',
}));

// ----------------------------------------------------------------------

export const _contacts = Array.from({ length: 20 }, (_, index) => {
  const status =
    (index % 2 && 'online') || (index % 3 && 'offline') || (index % 4 && 'always') || 'busy';

  return {
    id: _mock.id(index),
    status,
    role: _mock.role(index),
    email: _mock.email(index),
    name: _mock.fullName(index),
    phoneNumber: _mock.phoneNumber(index),
    lastActivity: _mock.time(index),
    avatarUrl: _mock.image.avatar(index),
    address: _mock.fullAddress(index),
  };
});

// ----------------------------------------------------------------------

export const _notifications = Array.from({ length: 9 }, (_, index) => ({
  id: _mock.id(index),
  avatarUrl: [
    _mock.image.avatar(1),
    _mock.image.avatar(2),
    _mock.image.avatar(3),
    _mock.image.avatar(4),
    _mock.image.avatar(5),
    null,
    null,
    null,
    null,
    null,
  ][index],
  type: ['friend', 'project', 'file', 'tags', 'payment', 'order', 'delivery', 'chat', 'mail'][
    index
  ],
  category: [
    'Communication',
    'Project UI',
    'File manager',
    'File manager',
    'File manager',
    'Order',
    'Order',
    'Communication',
    'Communication',
  ][index],
  isUnRead: _mock.boolean(index),
  createdAt: _mock.time(index),
  title:
    (index === 0 && `<p><strong>Deja Brady</strong> sent you a friend request</p>`) ||
    (index === 1 &&
      `<p><strong>Jayvon Hull</strong> mentioned you in <strong><a href='#'>Minimal UI</a></strong></p>`) ||
    (index === 2 &&
      `<p><strong>Lainey Davidson</strong> added file to <strong><a href='#'>File manager</a></strong></p>`) ||
    (index === 3 &&
      `<p><strong>Angelique Morse</strong> added new tags to <strong><a href='#'>File manager<a/></strong></p>`) ||
    (index === 4 &&
      `<p><strong>Giana Brandt</strong> request a payment of <strong>$200</strong></p>`) ||
    (index === 5 && `<p>Your order is placed waiting for shipping</p>`) ||
    (index === 6 && `<p>Delivery processing your order is being shipped</p>`) ||
    (index === 7 && `<p>You have new message 5 unread messages</p>`) ||
    (index === 8 && `<p>You have new mail`) ||
    '',
}));

// ----------------------------------------------------------------------

export const _mapContact = [
  { latlng: [25.7617, -80.1918], address: 'Miami, FL', phoneNumber: '(888) 555-0140' },
];

// ----------------------------------------------------------------------

export const _socials = [
  {
    value: 'instagram',
    label: 'Instagram',
    path: 'https://www.instagram.com/minimals',
  },
  {
    value: 'facebook',
    label: 'Facebook',
    path: 'https://www.facebook.com/minimals',
  },
];

// ----------------------------------------------------------------------

export const _pricingPlans = [
  {
    subscription: 'basic',
    price: 0,
    caption: 'Forever',
    lists: ['3 prototypes', '3 boards', 'Up to 5 team members'],
    labelAction: 'Current plan',
  },
  {
    subscription: 'starter',
    price: 4.99,
    caption: 'Saving $24 a year',
    lists: [
      '3 prototypes',
      '3 boards',
      'Up to 5 team members',
      'Advanced security',
      'Issue escalation',
    ],
    labelAction: 'Choose starter',
  },
  {
    subscription: 'premium',
    price: 9.99,
    caption: 'Saving $124 a year',
    lists: [
      '3 prototypes',
      '3 boards',
      'Up to 5 team members',
      'Advanced security',
      'Issue escalation',
      'Issue development license',
      'Permissions & workflows',
    ],
    labelAction: 'Choose premium',
  },
];

// ----------------------------------------------------------------------

export const _testimonials = [
  {
    name: _mock.fullName(1),
    postedDate: _mock.time(1),
    ratingNumber: 5.0,
    avatarUrl: _mock.image.avatar(1),
    content: `The setup was incredibly simple. The dashboard made everything so clear and easy to follow. The component library is comprehensive and saved us weeks of development time.`,
  },
  {
    name: _mock.fullName(2),
    postedDate: _mock.time(2),
    ratingNumber: 4.8,
    avatarUrl: _mock.image.avatar(2),
    content: `The onboarding process was seamless and I had my project running in under an hour. The dashboard guided me through each step perfectly. The design system is top-notch.`,
  },
  {
    name: _mock.fullName(3),
    postedDate: _mock.time(3),
    ratingNumber: 5.0,
    avatarUrl: _mock.image.avatar(3),
    content: `Minimal Dashboard made everything so easy! The step-by-step flow was perfect, and I always knew exactly what to do next. The design system is comprehensive and the whole experience was surprisingly simple from start to finish.`,
  },
  {
    name: _mock.fullName(4),
    postedDate: _mock.time(4),
    ratingNumber: 4.9,
    avatarUrl: _mock.image.avatar(4),
    content: `The dashboard is beautifully designed and so intuitive. Setup took maybe 20 minutes, and I could customize everything to match our brand. The theme is well-structured and easy to extend.`,
  },
  {
    name: _mock.fullName(5),
    postedDate: _mock.time(5),
    ratingNumber: 4.7,
    avatarUrl: _mock.image.avatar(5),
    content: `From initial setup to production deployment, everything was incredibly smooth. The platform has every component you could need. The dark mode and responsive design work flawlessly.`,
  },
  {
    name: _mock.fullName(6),
    postedDate: _mock.time(6),
    ratingNumber: 5.0,
    avatarUrl: _mock.image.avatar(6),
    content: `The implementation was effortless. The code is clean, well-organized, and follows best practices. The documentation is thorough and the support team is very responsive.`,
  },
];
