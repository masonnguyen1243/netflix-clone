import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function ProfilePage() {
  const user = await currentUser();

  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Tài khoản</h1>

      {user && (
        <div className="mt-6 flex flex-col gap-4">
          {user.imageUrl && (
            <Image
              src={user.imageUrl}
              width={80}
              height={80}
              alt="Avatar"
              className="rounded-full"
            />
          )}

          <dl className="mt-4 space-y-4">
            {user.fullName && (
              <div>
                <dt className="text-muted-foreground text-sm">Họ và tên</dt>
                <dd className="font-medium">{user.fullName}</dd>
              </div>
            )}
            {user.primaryEmailAddress?.emailAddress && (
              <div>
                <dt className="text-muted-foreground text-sm">Email</dt>
                <dd className="font-medium">
                  {user.primaryEmailAddress.emailAddress}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </main>
  );
}
