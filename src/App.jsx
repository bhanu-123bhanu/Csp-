import React, { useState, useEffect } from 'react'
import { AlertCircle, Users, Shield, MapPin, Upload, X, CheckCircle, Clock } from 'lucide-react'

const App = () => {
  const [view, setView] = useState('home')
  const [reports, setReports] = useState([])
  const [formData, setFormData] = useState({
    userName: '',
    description: '',
    image: null,
    location: null
  })
  const [loading, setLoading] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 })
  const [mapZoom, setMapZoom] = useState(5)
  const [selectedReport, setSelectedReport] = useState(null)

  // Load reports from storage
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    try {
      setLoading(true)
      const storedReports = localStorage.getItem('sanitary-reports')
      const data = storedReports ? JSON.parse(storedReports) : []
      setReports(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (error) {
      console.error('Error loading reports:', error)
      alert('Failed to load reports from local storage.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = { high: '#ef4444', medium: '#eab308', low: '#22c55e' }
    return colors[severity] || '#22c55e'
  }

  // AI-based severity classification (simple keyword-based)
  const classifySeverity = (description) => {
    const desc = description.toLowerCase()
    const highKeywords = ['urgent', 'severe', 'critical', 'emergency', 'overflow', 'blocked', 'dangerous']
    const mediumKeywords = ['dirty', 'unclean', 'smell', 'garbage', 'waste', 'broken']

    const highCount = highKeywords.filter((word) => desc.includes(word)).length
    const mediumCount = mediumKeywords.filter((word) => desc.includes(word)).length

    if (highCount > 0) return 'high'
    if (mediumCount > 0) return 'medium'
    return 'low'
  }

  const getLocation = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
          setLoading(false)
          alert('Location captured successfully!')
        },
        (error) => {
          setLoading(false)
          // Default to Andhra Pradesh center if location denied
          setFormData((prev) => ({ ...prev, location: { lat: 15.9129, lng: 79.74 } }))
          alert('Location access denied. Using default location (Andhra Pradesh).')
        }
      )
    } else {
      setLoading(false)
      alert('Geolocation is not supported by this browser')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitReport = () => {
    if (!formData.userName || !formData.description) {
      alert('Please fill in all required fields')
      return
    }

    if (!formData.location) {
      alert('Please capture your location first')
      return
    }

    const severity = classifySeverity(formData.description)
    const newReport = {
      id: Date.now(),
      user_name: formData.userName,
      description: formData.description,
      severity: severity,
      location_lat: formData.location.lat,
      location_lng: formData.location.lng,
      image_url: formData.image,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    try {
      setLoading(true)
      const storedReports = localStorage.getItem('sanitary-reports')
      const reports = storedReports ? JSON.parse(storedReports) : []
      reports.unshift(newReport)
      localStorage.setItem('sanitary-reports', JSON.stringify(reports))
      setReports(reports)
      alert('Report submitted successfully!')
      setFormData({ userName: '', description: '', image: null, location: null })
      setView('home')
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'admin123') {
      setIsLoggedIn(true)
      setView('dashboard')
    } else {
      alert('Invalid credentials. Use admin/admin123')
    }
  }

  const updateReportStatus = (reportId, newStatus) => {
    try {
      const storedReports = localStorage.getItem('sanitary-reports')
      const reports = storedReports ? JSON.parse(storedReports) : []
      const updatedReports = reports.map((r) =>
        r.id === reportId ? { ...r, status: newStatus } : r
      )
      localStorage.setItem('sanitary-reports', JSON.stringify(updatedReports))
      setReports(updatedReports)

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const focusOnReport = (report) => {
    setSelectedReport(report)
    setMapCenter({ lat: report.location.lat, lng: report.location.lng })
    setMapZoom(12)
  }

  // Build map URL with all report markers for OpenStreetMap
  const buildMapUrl = () => {
    const delta = 0.05
    const osmBBox = `${mapCenter.lng - delta}%2C${mapCenter.lat - delta}%2C${mapCenter.lng + delta}%2C${mapCenter.lat + delta}`
    const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
    
    if (mapsKey) {
      return `https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${mapCenter.lat},${mapCenter.lng}&zoom=${mapZoom}&maptype=roadmap`
    } else {
      // OpenStreetMap with marker for selected report
      if (selectedReport) {
        return `https://www.openstreetmap.org/export/embed.html?bbox=${osmBBox}&layer=mapnik&marker=${selectedReport.location_lat}%2C${selectedReport.location_lng}`
      }
      return `https://www.openstreetmap.org/export/embed.html?bbox=${osmBBox}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`
    }
  }

  // --- Views ---
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Sanitary Map AI</h1>
            <p className="text-xl text-gray-600">Promoting Hygiene Awareness & Community Action</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setView('awareness')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Users className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Public User</h2>
              <p className="text-gray-600">Learn about sanitation & report issues</p>
            </button>

            <button
              onClick={() => setView('login')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Shield className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin/NGO</h2>
              <p className="text-gray-600">Monitor & resolve sanitation issues</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'awareness') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Sanitation Awareness</h1>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Why Sanitation Matters</h3>
                <p className="text-gray-700">Proper sanitation prevents diseases, protects the environment, and improves quality of life for everyone in the community.</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Best Practices</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Dispose of waste in designated bins</li>
                  <li>Keep drains and sewers clear</li>
                  <li>Report sanitation issues promptly</li>
                  <li>Maintain personal and public hygiene</li>
                  <li>Use public toilets responsibly</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Common Issues to Report</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Overflowing garbage bins</li>
                  <li>Blocked drains or sewers</li>
                  <li>Illegal waste dumping</li>
                  <li>Broken public toilets</li>
                  <li>Stagnant water breeding mosquitoes</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => setView('report')}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-xl text-xl font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-lg"
          >
            Report a Problem →
          </button>
        </div>
      </div>
    )
  }

  if (view === 'report') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setView('awareness')}
            className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Report a Problem</h1>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Problem Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Describe the sanitation issue in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {formData.image ? (
                      <div className="relative">
                        <img src={formData.image} alt="Preview" className="max-h-48 mx-auto rounded" />
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setFormData((prev) => ({ ...prev, image: null }))
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">Click to upload image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <button
                  onClick={getLocation}
                  disabled={loading || formData.location}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                    formData.location ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  <MapPin className="w-5 h-5" />
                  {loading ? 'Capturing Location...' : formData.location ? 'Location Captured ✓' : 'Capture My Location *'}
                </button>
                {formData.location && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Lat: {formData.location.lat.toFixed(4)}, Lng: {formData.location.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmitReport}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all shadow-lg"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'login' && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setView('home')}
            className="mb-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
              <p className="text-gray-600 mt-2">Access the sanitary map dashboard</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password"
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                Login
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">Demo credentials: admin / admin123</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'dashboard' && isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Sanitary Map Dashboard</h1>
            <button
              onClick={() => {
                setIsLoggedIn(false)
                setView('home')
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.severity === 'high').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">Medium Priority</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.severity === 'medium').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">Low Priority</p>
                  <p className="text-2xl font-bold">{reports.filter((r) => r.severity === 'low').length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative" style={{ height: '600px' }}>
                <iframe
                  src={buildMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute top-4 left-4 right-4 pointer-events-none">
                  <div className="bg-white rounded-lg shadow-lg p-4 pointer-events-auto">
                    <p className="text-sm text-gray-600 mb-2">📍 Click on a report below to view its exact location on the map</p>
                    {selectedReport && (
                      <div className="mt-2 text-xs bg-blue-50 p-2 rounded">
                        <p className="font-semibold text-blue-900">📌 Selected Report:</p>
                        <p className="text-blue-800">Lat: {selectedReport.location_lat.toFixed(6)}</p>
                        <p className="text-blue-800">Lng: {selectedReport.location_lng.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-bold text-gray-800">Reports List</h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                {reports.length > 0 ? (
                  <div className="divide-y">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedReport?.id === report.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => focusOnReport(report)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: getSeverityColor(report.severity) }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{report.user_name}</p>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{report.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {report.location_lat?.toFixed(4)}, {report.location_lng?.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {report.status === 'resolved' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  <CheckCircle className="w-3 h-3" />
                                  Resolved
                                </span>
                              ) : report.status === 'in-progress' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                  <Clock className="w-3 h-3" />
                                  In Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No reports yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedReport && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: getSeverityColor(selectedReport.severity) }} />
                    <h3 className="text-xl font-bold text-gray-800 capitalize">{selectedReport.severity} Priority</h3>
                  </div>
                  <p className="text-gray-600">Reported by: {selectedReport.user_name}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Description:</h4>
                <p className="text-gray-700">{selectedReport.description}</p>
              </div>

              {selectedReport.image_url && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Image:</h4>
                  <img src={selectedReport.image_url} alt="Issue" className="max-h-64 rounded-lg" />
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Exact Location:
                </h4>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-gray-700 font-mono text-sm">
                    <strong>Latitude:</strong> {selectedReport.location_lat?.toFixed(8)}
                  </p>
                  <p className="text-gray-700 font-mono text-sm">
                    <strong>Longitude:</strong> {selectedReport.location_lng?.toFixed(8)}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${selectedReport.location_lat},${selectedReport.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block underline"
                  >
                    📍 Open in Google Maps
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'in-progress')}
                  disabled={selectedReport.status === 'in-progress' || selectedReport.status === 'resolved'}
                  className="flex-1 px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  {selectedReport.status === 'in-progress' ? 'In Progress' : 'Mark In Progress'}
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                  disabled={selectedReport.status === 'resolved'}
                  className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {selectedReport.status === 'resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default App
