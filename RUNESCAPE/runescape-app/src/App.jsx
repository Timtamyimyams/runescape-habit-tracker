import { AuthProvider } from './context/AuthContext'
import RuneScapeHabitTracker from './RuneScapeHabitTracker'

function App() {
  return (
    <AuthProvider>
      <RuneScapeHabitTracker />
    </AuthProvider>
  )
}

export default App
