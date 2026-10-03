"use client";

import { useState } from "react";
import UserRow, { type UserRowData } from "./UserRow";
import { cardClass, inputClass, mutedClass } from "./ui";

export default function UserList({ users, selfId }: { users: UserRowData[]; selfId: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? users.filter((u) =>
        [u.name, u.email, u.cfHandle ?? ""].some((x) => x.toLowerCase().includes(needle)),
      )
    : users;

  return (
    <div className="space-y-3">
      <input
        className={inputClass}
        placeholder="Search by name, email or handle"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {shown.length === 0 ? (
        <div className={cardClass}>
          <p className={mutedClass}>No users found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === selfId} />
          ))}
        </ul>
      )}
    </div>
  );
}
