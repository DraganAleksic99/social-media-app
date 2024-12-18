import { PropsWithChildren} from 'react'

export default function MainLayout({ children }: PropsWithChildren) {
  return <div className="layout sidesheet">{children}</div>
}
