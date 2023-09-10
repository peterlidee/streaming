type Props = {
  children: React.ReactNode;
};

export default function Nav({ children }: Props) {
  return (
    <nav style={{ display: 'flex', gap: '0 .5em', marginBottom: '1em' }}>
      {children}
    </nav>
  );
}
