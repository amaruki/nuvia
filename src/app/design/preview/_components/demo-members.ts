export interface DemoMember {
  id: string;
  name: string;
  email: string;
  role: string;
  chapter: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  joinedAt: Date;
}

const FIRST_NAMES = [
  "Adi",
  "Bunga",
  "Cahyo",
  "Dewi",
  "Eka",
  "Farah",
  "Galih",
  "Hana",
  "I Made",
  "Joko",
  "Kirana",
  "Lukman",
  "Maya",
  "Naufal",
  "Olivia",
  "Putra",
  "Qori",
  "Rina",
  "Satria",
  "Tiara",
];

const LAST_NAMES = [
  "Pratama",
  "Santoso",
  "Wijaya",
  "Kusuma",
  "Halim",
  "Nasution",
  "Saputra",
  "Anggraini",
  "Ramadhan",
  "Utami",
  "Hidayat",
  "Permata",
  "Firmansyah",
  "Lestari",
  "Gunawan",
  "Maharani",
];

const CHAPTERS = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Denpasar"];
const ROLES = ["Professional Member", "Student Member", "Corporate Member", "Lifetime Member"];
const STATUSES: DemoMember["status"][] = [
  "ACTIVE",
  "ACTIVE",
  "ACTIVE",
  "ACTIVE",
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "SUSPENDED",
];

export const DEMO_MEMBERS: DemoMember[] = Array.from({ length: 57 }).map((_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 7) % LAST_NAMES.length];
  return {
    id: `demo-member-${index + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase().replace(/\s+/g, ".")}.${last.toLowerCase()}@example.org`,
    role: ROLES[index % ROLES.length],
    chapter: CHAPTERS[(index * 3) % CHAPTERS.length],
    status: STATUSES[(index * 5) % STATUSES.length],
    joinedAt: new Date(2022 + (index % 4), index % 12, (index * 11) % 28 || 1),
  };
});
