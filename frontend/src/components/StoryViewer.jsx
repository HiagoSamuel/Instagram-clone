import { useEffect, useState } from 'react'
import Avatar from './Avatar/Avatar'

const STORY_DURATION_MS = 5000

export default function StoryViewer({ group, onClose }) {
  const [index, setIndex] = useState(0)
  const story = group?.stories?.[index]

  useEffect(() => {
    setIndex(0)
  }, [group])

  useEffect(() => {
    if (!story) return undefined

    const timer = window.setTimeout(() => {
      if (index < group.stories.length - 1) {
        setIndex((current) => current + 1)
      } else {
        onClose()
      }
    }, STORY_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [story, index, group, onClose])

  if (!story) return null

  return (
    <div className="story-viewer" role="dialog" aria-modal="true">
      <div className="story-viewer-progress">
        {group.stories.map((item, itemIndex) => (
          <span key={item.id} className={itemIndex <= index ? 'story-progress-active' : ''} />
        ))}
      </div>

      <header className="story-viewer-header">
        <Avatar src={group.user?.avatar_url} size={36} alt={group.user?.username || 'Usuário'} />
        <strong>{group.user?.username}</strong>
        <button type="button" onClick={onClose} aria-label="Fechar story">x</button>
      </header>

      <button
        type="button"
        className="story-viewer-hit story-viewer-prev"
        onClick={() => setIndex((current) => Math.max(current - 1, 0))}
        aria-label="Story anterior"
      />
      <img src={story.media_url} alt="Story" className="story-viewer-media" />
      <button
        type="button"
        className="story-viewer-hit story-viewer-next"
        onClick={() => {
          if (index < group.stories.length - 1) setIndex((current) => current + 1)
          else onClose()
        }}
        aria-label="Próximo story"
      />
    </div>
  )
}
