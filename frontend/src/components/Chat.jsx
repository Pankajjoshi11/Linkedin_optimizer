import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    experience: false,
    education: false,
    skills: false,
    languages: false,
    certifications: false,
  });
  const messagesEndRef = useRef(null);

  // Fetch profile and report data on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/profile')
      .then(response => setProfileData(response.data))
      .catch(error => console.error('Error fetching profile data:', error));

    axios.get('http://localhost:5000/api/report')
      .then(response => setReportData(response.data))
      .catch(error => console.error('Error fetching report data:', error));
  }, []);

  // Scroll to the latest message in chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Handle sending a message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        profileData: profileData,
        reportData: reportData
      });
      const botMessage = { role: 'bot', content: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, something went wrong!' }]);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Open/close chat
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
    if (!isChatOpen) setMessages([]); // Reset messages when opening chat
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LinkedIn Profile Sidebar */}
      <div className="w-1/3 bg-white p-6 shadow-md overflow-y-auto">
        {profileData ? (
          <>
            <h2 className="text-2xl font-bold mb-4">{profileData.name}</h2>
            <p className="text-gray-600 mb-2">{profileData.headline}</p>
            <p className="text-gray-500 mb-4">{profileData.location}</p>

            {profileData.summary && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold">About</h3>
                <p className="text-gray-600">{profileData.summary}</p>
              </div>
            )}

            {reportData && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Report Summary</h3>
                <p className="text-gray-600">Overall Score: {reportData.scores?.overall || 0}/100</p>
                <p className="text-gray-600">Key Insights:</p>
                <ul className="list-disc pl-5">
                  {reportData.insights?.map((insight, index) => (
                    <li key={index} className="text-gray-600">{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold cursor-pointer" onClick={() => toggleSection('experience')}>
                Experience {expandedSections.experience ? '▲' : '▼'}
              </h3>
              {expandedSections.experience && profileData.experience?.map((exp, index) => (
                <div key={index} className="mt-2">
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-gray-600">{exp.company}</p>
                  <p className="text-gray-500 text-sm">{exp.duration}</p>
                  {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold cursor-pointer" onClick={() => toggleSection('education')}>
                Education {expandedSections.education ? '▲' : '▼'}
              </h3>
              {expandedSections.education && profileData.education?.map((edu, index) => (
                <div key={index} className="mt-2">
                  <p className="font-medium">{edu.school}</p>
                  <p className="text-gray-600">{edu.degree}</p>
                  <p className="text-gray-500 text-sm">{edu.year}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold cursor-pointer" onClick={() => toggleSection('skills')}>
                Skills {expandedSections.skills ? '▲' : '▼'}
              </h3>
              {expandedSections.skills && (
                <ul className="list-disc pl-5">
                  {profileData.skills?.map((skill, index) => (
                    <li key={index} className="text-gray-600">{skill}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold cursor-pointer" onClick={() => toggleSection('languages')}>
                Languages {expandedSections.languages ? '▲' : '▼'}
              </h3>
              {expandedSections.languages && profileData.languages?.map((lang, index) => (
                <div key={index} className="mt-2">
                  <p className="font-medium">{lang.language}</p>
                  <p className="text-gray-600">{lang.proficiency}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold cursor-pointer" onClick={() => toggleSection('certifications')}>
                Certifications {expandedSections.certifications ? '▲' : '▼'}
              </h3>
              {expandedSections.certifications && profileData.certifications?.map((cert, index) => (
                <div key={index} className="mt-2">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-gray-600">{cert.issuer}</p>
                  <p className="text-gray-500 text-sm">{cert.date}</p>
                </div>
              ))}
            </div>

            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              onClick={toggleChat}
            >
              Start Chat
            </button>
          </>
        ) : (
          <p className="text-gray-600">Loading profile data...</p>
        )}
      </div>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-3/4 h-3/4 rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Chat with LLM</h2>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={toggleChat}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 p-3 rounded-lg max-w-md ${
                    msg.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about the LinkedIn profile or report..."
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
              <button
                className="mt-2 text-blue-500 hover:text-blue-600"
                onClick={toggleChat}
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;