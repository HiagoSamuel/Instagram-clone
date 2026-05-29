import './Avatar.css'

export default function Avatar({ src, size = 40, alt = 'Avatar' }) {
  const sizeClass = size <= 32 ? 'small' : size <= 48 ? 'medium' : 'large'

  return (
    <img
      className={`avatar ${sizeClass}`}
      src={src || '/default-avatar.png'}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
    />
  )
}
