import { ProfileSkeleton } from "@/widgets/profile";

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-6 sm:space-y-6 sm:px-6 md:pt-8">
      <ProfileSkeleton />
    </main>
  );
}
