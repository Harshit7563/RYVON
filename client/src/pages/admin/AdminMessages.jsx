import { useEffect, useState } from "react";
import { adminDeleteMessage, adminMessages, adminReadMessage } from "../../api";

export default function AdminMessages() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = () =>
    adminMessages()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const mark = async (id) => {
    await adminReadMessage(id);
    await load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this message?")) return;
    await adminDeleteMessage(id);
    await load();
  };

  const shown = list.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "read") return m.read;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase">Messages</h1>
        <button
          type="button"
          onClick={() => { setError(""); load(); }}
          className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase hover:border-tss"
        >
          Refresh
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-tss">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["unread", "Unread"],
          ["read", "Read"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${
              filter === id ? "bg-tss text-white" : "border border-line bg-white text-mute"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-mute">{shown.length} of {list.length} messages</p>

      <div className="mt-5 space-y-3">
        {shown.length === 0 && <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No messages</p>}
        {shown.map((m) => (
          <div key={m.id} className={`rounded-xl border p-4 shadow-sm ${m.read ? "border-line bg-white" : "border-tss/30 bg-tss/5"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{m.name}</p>
                <p className="text-xs text-mute">
                  <a href={`mailto:${m.email}`} className="underline hover:text-tss">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
                {m.topic && <p className="mt-1 text-[11px] font-bold uppercase text-tss">{m.topic}</p>}
              </div>
              <div className="flex gap-3">
                {!m.read && (
                  <button type="button" onClick={() => mark(m.id)} className="text-xs font-bold uppercase text-tss underline">
                    Mark read
                  </button>
                )}
                <a href={`mailto:${m.email}?subject=Re:%20RYVON%20support`} className="text-xs font-bold uppercase underline">
                  Reply
                </a>
                <button type="button" onClick={() => remove(m.id)} className="text-xs font-bold uppercase text-tss underline">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#444] whitespace-pre-wrap">{m.message}</p>
            <p className="mt-2 text-[11px] text-mute">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
