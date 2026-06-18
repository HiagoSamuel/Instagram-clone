import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import Avatar from './Avatar/Avatar'
import StoryViewer from './StoryViewer'

export default function StoriesBar() {
  const inputRef = useRef(null)
  const [groups, setGroups] = useState([])
  const [activeGroupIndex, setActiveGroupIndex] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadStories = async () => {
    try {
      const { data } = await api.get('/stories')
      setGroups(data)
    } catch (_error) {
      setError('Não foi possível carregar stories.')
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  const createStory = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('media', file)
      await api.post('/stories', formData)
      await loadStories()
    } catch (uploadError) {
      setError(uploadError.response?.data?.error || 'Não foi possível criar o story.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <section className="stories-bar" aria-label="Stories">
      <button
        type="button"
        className="story-create-button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <span>+</span>
        {uploading ? 'Enviando...' : 'Story'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={createStory} />

      {groups.map((group, index) => (
        <button
          key={group.user?.id || index}
          type="button"
          className={`story-pill ${group.has_unseen ? 'story-pill-new' : 'story-pill-seen'}`}
          onClick={() => setActiveGroupIndex(index)}
        >
          <Avatar src={group.user?.avatar_url} size={48} alt={group.user?.username || 'Story'} />
          <span>{group.user?.username}</span>
        </button>
      ))}

      {error && <span className="stories-error">{error}</span>}
      {activeGroupIndex !== null && (
        <StoryViewer
          group={groups[activeGroupIndex]}
          onClose={() => setActiveGroupIndex(null)}
        />
      )}
    </section>
  )
}
