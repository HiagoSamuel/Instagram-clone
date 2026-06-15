import './Avatar.css'

export const DEFAULT_AVATAR_SRC =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22%3E%3Crect width=%2296%22 height=%2296%22 rx=%2248%22 fill=%22%23eef2ff%22/%3E%3Ccircle cx=%2248%22 cy=%2237%22 r=%2217%22 fill=%22%2394a3b8%22/%3E%3Cpath d=%22M20 82c5-18 18-28 28-28s23 10 28 28%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E'

export default function Avatar({ src, size = 40, alt = 'Avatar' }) {
  const sizeClass = size <= 32 ? 'small' : size <= 48 ? 'medium' : 'large'

  return (
    <img
      className={`avatar ${sizeClass}`}
      src={src || DEFAULT_AVATAR_SRC}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
    />
  )
}
