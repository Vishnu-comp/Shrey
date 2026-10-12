// Small inline vectors render without emoji fonts or image downloads.
const shapes = {
  flame: <path d="M12 3c1 5-5 5-5 11a5 5 0 0 0 10 0c0-2-1-4-2-5 0 3-2 3-2 1 0-2 0-5-1-7Z" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
  flag: <><path d="M5 21V4m0 0h14l-3 4 3 4H5" /></>,
  trophy: <><path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm4 11v5m-4 2h8M8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4" /></>,
  book: <><path d="M12 6v15m0-15C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-3-1-6-1-9 2Z" /></>,
  reader: <><circle cx="12" cy="5" r="3" /><path d="M12 13v8m0-8c-3-2-6-2-9-1v7c3-1 6-1 9 2 3-3 6-3 9-2v-7c-3-1-6-1-9 1Z" /></>,
};
export default function Icon({ name = 'star' }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.star}</svg>;
}
export const badgeIcons = ['flag', 'flame', 'trophy', 'star', 'book', 'reader'];
