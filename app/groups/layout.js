import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Groups-MindMesh",
  description: "Find and connect with students who match your learning goals.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootGroupsLayout({ children }) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}