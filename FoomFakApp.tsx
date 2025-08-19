import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, QrCode, User, Store, Gift, Star, Check, X, Menu, Home, History, Settings, Baby, BookOpen, Mic, Timer, Users, ShoppingCart, Camera, UserCheck, Award, Trophy, Target, Zap, Plus } from 'lucide-react';
import { ActivityRecorder } from './src/components/ActivityRecorder.tsx';

const FoomFakApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStoryReader, setShowStoryReader] = useState(false);
  const [showChildcareTimer, setShowChildcareTimer] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showActivityRecorder, setShowActivityRecorder] = useState(false);
  const [notification, setNotification] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [childcareSession, setChildcareSession] = useState(null);
  const [childcareTime, setChildcareTime] = useState(0);
  const [selectedParent, setSelectedParent] = useState(null);

  // Mock API responses
  const mockAPI = {
    // User registration
    register: (userData: any) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newUser = {
            id: Date.now(),
            ...userData,
            points: 0,
            level: 1,
            streak: 0,
            quota: 1500,
            usedQuota: 0,
            earnings: 0,
            jobHistory: [],
            achievements: [],
            createdAt: new Date().toISOString()
          };
          resolve({ success: true, user: newUser });
        }, 1000);
      });
    },

    // Login
    login: (email: string, password: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock users for testing
          const mockUsers = [
            {
              id: 1,
              email: 'parent@example.com',
              password: 'password',
              name: 'นางสาวสมใจ ใจดี',
              role: 'parent',
              phone: '081-234-5678',
              points: 1250,
              level: 3,
              streak: 7,
              quota: 1500,
              usedQuota: 200,
              earnings: 350,
              jobHistory: [],
              achievements: ['first_activity', 'week_streak', 'level_up'],
              childName: 'น้องมินิ',
              childAge: 3
            },
            {
              id: 2,
              email: 'caregiver@example.com',
              password: 'password',
              name: 'นางสมศรี ใจบุญ',
              role: 'caregiver',
              phone: '081-987-6543',
              points: 2100,
              level: 5,
              streak: 12,
              quota: 1500,
              usedQuota: 150,
              earnings: 800,
              jobHistory: [],
              achievements: ['super_caregiver', 'month_streak', 'top_rated'],
              experience: '5 ปี',
              rating: 4.8
            },
            {
              id: 3,
              email: 'admin@example.com',
              password: 'password',
              name: 'ผู้ดูแลระบบ',
              role: 'admin',
              phone: '081-000-0000',
              points: 0,
              level: 1,
              streak: 0,
              quota: 0,
              usedQuota: 0,
              earnings: 0,
              jobHistory: [],
              achievements: []
            }
          ];
          
          const user = mockUsers.find(u => u.email === email && u.password === password);
          if (user) {
            resolve({ success: true, user });
          } else {
            resolve({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
          }
        }, 1000);
      });
    },

    // Record story reading
    recordStoryReading: (userId: number, duration: number, category: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (duration >= 900) { // 15 minutes = 900 seconds
            const points = 100;
            const streakBonus = Math.floor(Math.random() * 20) + 10; // 10-30 bonus points
            resolve({
              success: true,
              earnings: 50,
              points: points + streakBonus,
              streak: true,
              level: Math.floor((points + streakBonus) / 500) + 1,
              message: `บันทึกการอ่านนิทานสำเร็จ! +${points + streakBonus} แต้ม ได้รับค่าตอบแทน 50 บาท`
            });
          } else {
            resolve({
              success: false,
              message: 'กรุณาอ่านนิทานให้ครบ 15 นาที'
            });
          }
        }, 1000);
      });
    },

    // Start childcare session
    startChildcare: (caregiverId: number, parentId: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const session = {
            id: Date.now(),
            caregiverId,
            parentId,
            startTime: new Date().toISOString(),
            status: 'active'
          };
          resolve({ success: true, session });
        }, 1000);
      });
    },

    // End childcare session
    endChildcare: (sessionId: number, duration: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const earnings = Math.min(duration * 100, 3000); // Max 30 hours = 3000 baht
          resolve({
            success: true,
            earnings,
            duration,
            message: `ดูแลเด็กเสร็จสิ้น ${duration} ชั่วโมง ได้รับค่าตอบแทน ${earnings} บาท`
          });
        }, 1000);
      });
    },

    // Rate caregiver
    rateCaregiver: (sessionId: number, rating: number, comment: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'ขอบคุณสำหรับการประเมิน'
          });
        }, 1000);
      });
    },

    // Use quota at store
useQuota: (userId: number, amount: number, storeId: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            remainingQuota: 1500 - amount,
            message: `ใช้โควต้าสำเร็จ ${amount} บาท`
          });
        }, 1000);
      });
    }
  };

  // Stories for reading
  const stories = [
    {
      id: 1,
      title: 'นิทานกบน้อยผจญภัย',
      category: 'นิทาน',
      icon: '🐸',
      content: 'กาลครั้งหนึ่งนานมาแล้ว มีกบน้อยตัวหนึ่งชื่อว่า กบเขียว...'
    },
    {
      id: 2,
      title: 'อาหารมีประโยชน์',
      category: 'อาหาร',
      icon: '🥗',
      content: 'วันนี้เราจะมาเรียนรู้เกี่ยวกับอาหารที่มีประโยชน์ต่อร่างกาย...'
    },
    {
      id: 3,
      title: 'ร่างกายของเรา',
      category: 'ร่างกาย',
      icon: '👶',
      content: 'ร่างกายของเราประกอบด้วยส่วนต่างๆ ที่สำคัญมากมาย...'
    },
    {
      id: 4,
      title: 'การใช้ชีวิตประจำวัน',
      category: 'ชีวิตประจำวัน',
      icon: '🏠',
      content: 'ในแต่ละวันเราจะต้องทำกิจกรรมต่างๆ เพื่อดูแลตัวเอง...'
    }
  ];

  // Partner stores
  const partnerStores = [
    {
      id: 1,
      name: 'ร้านอาหารเด็กแสนดี',
      category: 'อาหารเด็ก',
      icon: '🍼',
      location: 'สยามสแควร์',
      qrCode: 'STORE-001'
    },
    {
      id: 2,
      name: 'ร้านของเล่นเด็ก',
      category: 'ของเล่นเด็ก',
      icon: '🧸',
      location: 'อารีย์',
      qrCode: 'STORE-002'
    },
    {
      id: 3,
      name: 'ร้านเสื้อผ้าเด็ก',
      category: 'เสื้อผ้าเด็ก',
      icon: '👶',
      location: 'เอกมัย',
      qrCode: 'STORE-003'
    }
  ];

  // Available parents for childcare
  const availableParents = [
    {
      id: 1,
      name: 'นางสาวสมใจ ใจดี',
      childName: 'น้องมินิ',
      childAge: 3,
      location: 'บางนา',
      phone: '081-234-5678'
    },
    {
      id: 2,
      name: 'นายสมชาย ดีใจ',
      childName: 'น้องปุ๊ก',
      childAge: 4,
      location: 'ลาดพร้าว',
      phone: '081-987-6543'
    }
  ];

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (childcareSession) {
      interval = setInterval(() => {
        setChildcareTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [childcareSession]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleActivityComplete = (activityData: any) => {
    setCurrentUser((prev: any) => ({
      ...prev,
      points: (prev?.points || 0) + activityData.points,
      earnings: (prev?.earnings || 0) + Math.floor(activityData.points / 2),
      streak: (prev?.streak || 0) + 1,
      jobHistory: [...(prev?.jobHistory || []), {
        id: activityData.id,
        type: 'activity',
        activity: activityData.name,
        duration: activityData.duration,
        points: activityData.points,
        earnings: Math.floor(activityData.points / 2),
        date: new Date().toISOString()
      }]
    }));
    
    showNotification(`บันทึก${activityData.name}สำเร็จ! +${activityData.points} แต้ม`);
    setShowActivityRecorder(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Login Modal
  const LoginModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
      setLoading(true);
      const result = await mockAPI.login(email, password) as any;
      setLoading(false);
      
      if (result.success) {
        setCurrentUser(result.user);
        setShowLogin(false);
        showNotification('เข้าสู่ระบบสำเร็จ!');
      } else {
        showNotification(result.message);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">เข้าสู่ระบบ</h2>
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>ทดลองใช้ (พ่อแม่): parent@example.com / password</p>
            <p>ทดลองใช้ (ผู้ดูแล): caregiver@example.com / password</p>
          </div>
        </div>
      </div>
    );
  };

  // Register Modal
  const RegisterModal = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'parent',
      childName: '',
      childAge: '',
      experience: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
      setLoading(true);
      const result = await mockAPI.register(formData) as any;
      setLoading(false);
      
      if (result.success) {
        setCurrentUser(result.user);
        setShowRegister(false);
        showNotification('ลงทะเบียนสำเร็จ! ได้รับโควต้า 1,500 บาท');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">สมัครสมาชิก</h2>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ประเภทผู้ใช้</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="parent">ผู้ปกครอง (พ่อแม่วัยรุ่น)</option>
              <option value="caregiver">ผู้ดูแลเด็ก (ยายข้างบ้าน)</option>
            </select>
          </div>
          
          <input
            type="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="text"
            placeholder="ชื่อ-นามสกุล"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="tel"
            placeholder="เบอร์โทรศัพท์"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full p-2 border rounded mb-3"
          />
          
          {formData.role === 'parent' && (
            <>
              <input
                type="text"
                placeholder="ชื่อลูก"
                value={formData.childName}
                onChange={(e) => setFormData({...formData, childName: e.target.value})}
                className="w-full p-2 border rounded mb-3"
              />
              <input
                type="number"
                placeholder="อายุลูก"
                value={formData.childAge}
                onChange={(e) => setFormData({...formData, childAge: e.target.value})}
                className="w-full p-2 border rounded mb-3"
              />
            </>
          )}
          
          {formData.role === 'caregiver' && (
            <input
              type="text"
              placeholder="ประสบการณ์การดูแลเด็ก"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="w-full p-2 border rounded mb-3"
            />
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
            <button
              onClick={() => setShowRegister(false)}
              className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Story Reader Modal
  const StoryReaderModal = () => {
    const [selectedStory, setSelectedStory] = useState(null);

    const startReading = (story: any) => {
      setSelectedStory(story);
      setIsRecording(true);
      setRecordingTime(0);
      showNotification('เริ่มการอ่านนิทาน กรุณาอ่านให้ครบ 15 นาที');
    };

    const stopReading = async () => {
      setIsRecording(false);
      
      if (recordingTime >= 900) { // 15 minutes
        const result = await mockAPI.recordStoryReading(
          (currentUser as any)?.id,
          recordingTime,
          (selectedStory as any)?.category
        ) as any;
        
        if (result.success) {
          setCurrentUser((prev: any) => ({
            ...prev,
            points: (prev?.points || 0) + result.points,
            level: result.level,
            streak: (prev?.streak || 0) + 1,
            earnings: (prev?.earnings || 0) + result.earnings,
            jobHistory: [...(prev?.jobHistory || []), {
              id: Date.now(),
              type: 'story_reading',
              story: (selectedStory as any)?.title,
              duration: recordingTime,
              earnings: result.earnings,
              points: result.points,
              date: new Date().toISOString()
            }]
          }));
          showNotification(result.message);
        }
      } else {
        showNotification('กรุณาอ่านนิทานให้ครบ 15 นาที');
      }
      
      setSelectedStory(null);
      setRecordingTime(0);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">อ่านนิทานให้ลูกฟัง</h2>
          
          {!selectedStory ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                เลือกเรื่องที่จะอ่าน (ได้ 50 บาท/15 นาที)
              </p>
              {stories.map(story => (
                <button
                  key={story.id}
                  onClick={() => startReading(story)}
                  className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{story.icon}</span>
                    <div>
                      <h3 className="font-semibold">{story.title}</h3>
                      <p className="text-sm text-gray-600">{story.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">{(selectedStory as any)?.icon}</div>
              <h3 className="text-lg font-bold mb-2">{(selectedStory as any)?.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{(selectedStory as any)?.content}</p>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Mic className={`w-6 h-6 mr-2 ${isRecording ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((recordingTime / 900) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm mt-2">เป้าหมาย: 15 นาที</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={stopReading}
                  className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  <Square className="w-4 h-4 mr-2 inline" />
                  หยุดอ่าน
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowStoryReader(false)}
            className="w-full mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  };

  // Childcare Timer Modal
  const ChildcareTimerModal = () => {
    const startChildcare = async (parent: any) => {
      const result = await mockAPI.startChildcare((currentUser as any)?.id, parent?.id) as any;
      if (result.success) {
        setChildcareSession(result.session);
        setSelectedParent(parent);
        setChildcareTime(0);
        showNotification(`เริ่มดูแล ${parent.childName} แล้ว`);
      }
    };

    const endChildcare = async () => {
      const hours = Math.floor(childcareTime / 3600);
      const result = await mockAPI.endChildcare((childcareSession as any)?.id, hours) as any;
      
      if (result.success) {
        setCurrentUser((prev: any) => ({
          ...prev,
          earnings: (prev?.earnings || 0) + result.earnings,
          jobHistory: [...(prev?.jobHistory || []), {
            id: Date.now(),
            type: 'childcare',
            parent: (selectedParent as any)?.name,
            child: (selectedParent as any)?.childName,
            duration: hours,
            earnings: result.earnings,
            date: new Date().toISOString()
          }]
        }));
        
        setChildcareSession(null);
        setSelectedParent(null);
        setChildcareTime(0);
        setShowRatingModal(true);
        showNotification(result.message);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">ดูแลเด็กปฐมวัย</h2>
          
          {!childcareSession ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                เลือกครอบครัวที่จะดูแล (ได้ 100 บาท/ชั่วโมง)
              </p>
              {availableParents.map(parent => (
                <button
                  key={parent.id}
                  onClick={() => startChildcare(parent)}
                  className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center">
                    <Baby className="w-6 h-6 mr-3 text-pink-500" />
                    <div>
                      <h3 className="font-semibold">{parent.name}</h3>
                      <p className="text-sm text-gray-600">
                        {parent.childName} (อายุ {parent.childAge} ขวบ)
                      </p>
                      <p className="text-sm text-gray-500">{parent.location}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">👶</div>
              <h3 className="text-lg font-bold mb-2">กำลังดูแล {(selectedParent as any)?.childName}</h3>
              <p className="text-sm text-gray-600 mb-4">ผู้ปกครอง: {(selectedParent as any)?.name}</p>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Timer className="w-6 h-6 mr-2 text-blue-500" />
                  <span className="text-2xl font-mono">{formatHours(childcareTime)}</span>
                </div>
                <p className="text-sm">ค่าตอบแทนปัจจุบัน: {Math.floor(childcareTime / 3600) * 100} บาท</p>
              </div>
              
              <button
                onClick={endChildcare}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                <Square className="w-4 h-4 mr-2 inline" />
                สิ้นสุดการดูแล
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowChildcareTimer(false)}
            className="w-full mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  };

  // Rating Modal
  const RatingModal = () => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const submitRating = async () => {
      await mockAPI.rateCaregiver((childcareSession as any)?.id, rating, comment);
      setShowRatingModal(false);
      showNotification('ขอบคุณสำหรับการประเมิน');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">ประเมินผู้ดูแล</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">ความพึงพอใจ</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">ความคิดเห็น</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="แสดงความคิดเห็น..."
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={submitRating}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              ส่งการประเมิน
            </button>
            <button
              onClick={() => setShowRatingModal(false)}
              className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              ข้าม
            </button>
          </div>
        </div>
      </div>
    );
  };

  // QR Scanner Modal
  const QRScannerModal = () => {
    const [scannedCode, setScannedCode] = useState('');
    const [amount, setAmount] = useState('');

    const useQuota = async () => {
      if (!scannedCode || !amount) {
        showNotification('กรุณาสแกน QR Code และระบุจำนวนเงิน');
        return;
      }

      const result = await mockAPI.useQuota((currentUser as any)?.id, parseInt(amount), parseInt(scannedCode)) as any;
      if (result.success) {
        setCurrentUser((prev: any) => ({
          ...prev,
          usedQuota: (prev?.usedQuota || 0) + parseInt(amount)
        }));
        showNotification(result.message);
        setShowQRScanner(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">ใช้โควต้าที่ร้านค้า</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">สแกน QR Code ร้านค้า</label>
            <div className="bg-gray-100 p-4 rounded-lg text-center mb-2">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">สแกน QR Code ที่ร้านค้า</p>
            </div>
            <input
              type="text"
              placeholder="หรือใส่รหัสร้านค้า"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">จำนวนเงิน</label>
            <input
              type="number"
              placeholder="ระบุจำนวนเงิน"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <p className="text-sm text-gray-600 mt-1">
              โควต้าคงเหลือ: {((currentUser as any)?.quota || 0) - ((currentUser as any)?.usedQuota || 0)} บาท
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={useQuota}
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              ใช้โควต้า
            </button>
            <button
              onClick={() => setShowQRScanner(false)}
              className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Home Tab
  const HomeTab = () => (
    <div className="p-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับสู่ ฟูมฟัก!</h1>
        <p className="text-sm mb-2">ดูแลลูกวัยปฐมวัยของพ่อแม่วัยรุ่นที่เป็นเยาวชนนอกระบบการศึกษา</p>
        
        {currentUser ? (
          <div className="mt-4 p-3 bg-white bg-opacity-20 rounded">
            <p>สวัสดี {(currentUser as any)?.name}</p>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-300" />
                <span>{(currentUser as any)?.points || 0} แต้ม</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-1 text-yellow-300" />
                <span>เลเวล {(currentUser as any)?.level || 1}</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-1 text-orange-300" />
                <span>{(currentUser as any)?.streak || 0} วัน</span>
              </div>
            </div>
            <p className="mt-1">รายได้: {(currentUser as any)?.earnings || 0} บาท</p>
            {(currentUser as any)?.role === 'parent' && (currentUser as any)?.childName && (
              <p>ลูก: {(currentUser as any)?.childName} ({(currentUser as any)?.childAge} ขวบ)</p>
            )}
          </div>
        ) : (
          <p>กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        )}
      </div>

      {currentUser && (
        <div className="space-y-4">
          {(currentUser as any)?.role === 'parent' && (
            <>
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-6 mb-4">
                <h3 className="font-bold text-lg mb-2">บันทึกกิจกรรมลูก</h3>
                <p className="text-sm mb-4 opacity-90">
                  บันทึกกิจกรรมการดูแลลูก ได้แต้มและเงินรางวัล!
                </p>
                <button
                  onClick={() => setShowActivityRecorder(true)}
                  className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold flex items-center hover:bg-pink-50 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  เริ่มบันทึกกิจกรรม
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  อ่านนิทานพิเศษ
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  อ่านหนังสือให้ลูกฟัง 15 นาที ได้ 100 แต้ม + 50 บาท
                </p>
                <button
                  onClick={() => setShowStoryReader(true)}
                  className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
                >
                  <Mic className="w-4 h-4 mr-2 inline" />
                  เริ่มอ่านนิทาน
                </button>
              </div>
            </>
          )}

          {(currentUser as any)?.role === 'caregiver' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-3 flex items-center">
                <Baby className="w-5 h-5 mr-2" />
                งานสำหรับผู้ดูแล
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                ดูแลเด็กปฐมวัย รับ 100 บาท/ชั่วโมง (สูงสุด 30 ชั่วโมง/เดือน)
              </p>
              <button
                onClick={() => setShowChildcareTimer(true)}
                className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600"
              >
                <Timer className="w-4 h-4 mr-2 inline" />
                เริ่มดูแลเด็ก
              </button>
            </div>
          )}

          {(currentUser as any)?.role === 'admin' && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 mb-4">
              <h3 className="font-bold text-lg mb-2">ระบบจัดการ CMS</h3>
              <p className="text-sm mb-4 opacity-90">
                จัดการเนื้อหา ผู้ใช้งาน และรางวัลในแอป
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-white text-purple-600 px-4 py-2 rounded font-semibold text-sm">
                  จัดการผู้ใช้
                </button>
                <button className="bg-white text-purple-600 px-4 py-2 rounded font-semibold text-sm">
                  จัดการรางวัล
                </button>
                <button className="bg-white text-purple-600 px-4 py-2 rounded font-semibold text-sm">
                  สถิติการใช้งาน
                </button>
                <button className="bg-white text-purple-600 px-4 py-2 rounded font-semibold text-sm">
                  จัดการเนื้อหา
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              ใช้โควต้าที่ร้านค้า
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              ใช้โควต้า {((currentUser as any)?.quota || 0) - ((currentUser as any)?.usedQuota || 0)} บาท ที่ร้านค้าพันธมิตร
            </p>
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
            >
              <QrCode className="w-4 h-4 mr-2 inline" />
              สแกน QR Code ร้านค้า
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-lg mb-3">ร้านค้าพันธมิตร</h3>
            <div className="space-y-2">
              {partnerStores.map(store => (
                <div key={store.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <span className="text-2xl mr-3">{store.icon}</span>
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-gray-600">{store.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // History Tab
  const HistoryTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">ประวัติการทำงาน</h2>
      {currentUser && ((currentUser as any)?.jobHistory?.length || 0) > 0 ? (
        <div className="space-y-4">
          {((currentUser as any)?.jobHistory || []).map((job: any) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">
                    {job.type === 'story_reading' ? 'อ่านนิทาน' : 'ดูแลเด็ก'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {job.story || `${job.parent} - ${job.child}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(job.date).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{job.earnings} บาท</p>
                  <p className="text-sm text-gray-500">
                    {job.type === 'story_reading' 
                      ? `${Math.floor(job.duration / 60)} นาที`
                      : `${job.duration} ชั่วโมง`
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">ยังไม่มีประวัติการทำงาน</p>
        </div>
      )}
    </div>
  );

  // Points Tab
  const PointsTab = () => {
    const availableRewards = [
      { id: 1, title: 'ผลิตภัณฑ์ดูแลเด็ก', points: 500, category: 'baby', icon: '🍼' },
      { id: 2, title: 'ของเล่นเสริมพัทนา', points: 800, category: 'toys', icon: '🧸' },
      { id: 3, title: 'หนังสือนิทานเด็ก', points: 300, category: 'books', icon: '📚' },
      { id: 4, title: 'เสื้อผ้าเด็ก', points: 1000, category: 'clothes', icon: '👶' },
      { id: 5, title: 'อาหารเสริม', points: 600, category: 'food', icon: '🥗' },
      { id: 6, title: 'วิตามินเด็ก', points: 700, category: 'health', icon: '💊' }
    ];

    return (
      <div className="p-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-2">แต้มสะสมของคุณ</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-8 h-8 mr-2" />
              <span className="text-3xl font-bold">{(currentUser as any)?.points || 0}</span>
            </div>
            <div className="text-right">
              <div className="flex items-center mb-1">
                <Trophy className="w-5 h-5 mr-1" />
                <span>เลเวล {(currentUser as any)?.level || 1}</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-1" />
                <span>Streak {(currentUser as any)?.streak || 0} วัน</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4">แลกรางวัล</h3>
        <div className="grid grid-cols-2 gap-4">
          {availableRewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="text-center">
                <div className="text-3xl mb-2">{reward.icon}</div>
                <h4 className="font-semibold text-sm mb-2">{reward.title}</h4>
                <div className="flex items-center justify-center mb-3">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-bold">{reward.points}</span>
                </div>
                <button 
                  className={`w-full py-2 px-3 rounded text-xs font-medium ${
                    ((currentUser as any)?.points || 0) >= reward.points 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={((currentUser as any)?.points || 0) < reward.points}
                  onClick={() => {
                    if (((currentUser as any)?.points || 0) >= reward.points) {
                      setCurrentUser((prev: any) => ({
                        ...prev,
                        points: (prev?.points || 0) - reward.points
                      }));
                      showNotification(`แลกรางวัล ${reward.title} สำเร็จ!`);
                    }
                  }}
                >
                  {((currentUser as any)?.points || 0) >= reward.points ? 'แลกเลย!' : 'แต้มไม่พอ'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            ความท้าทาย
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <div>
                <p className="font-medium">อ่านนิทาน 7 วันติดต่อกัน</p>
                <p className="text-sm text-gray-600">รางวัล: 200 แต้ม</p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(((currentUser as any)?.streak || 0) / 7 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs">{Math.min((currentUser as any)?.streak || 0, 7)}/7</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <div>
                <p className="font-medium">สะสม 1,000 แต้ม</p>
                <p className="text-sm text-gray-600">รางวัル: ปลดล็อคของรางวัลพิเศษ</p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${Math.min(((currentUser as any)?.points || 0) / 1000 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs">{Math.min((currentUser as any)?.points || 0, 1000)}/1000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile Tab
  const ProfileTab = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">โปรไฟล์</h2>
      {currentUser ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold mb-3">ข้อมูลส่วนตัว</h3>
            <div className="space-y-2">
              <p><strong>ชื่อ:</strong> {(currentUser as any)?.name}</p>
              <p><strong>อีเมล:</strong> {(currentUser as any)?.email}</p>
              <p><strong>เบอร์โทร:</strong> {(currentUser as any)?.phone}</p>
              <p><strong>ประเภท:</strong> {(currentUser as any)?.role === 'parent' ? 'ผู้ปกครอง' : 'ผู้ดูแลเด็ก'}</p>
              {(currentUser as any)?.childName && (
                <p><strong>ลูก:</strong> {(currentUser as any)?.childName} ({(currentUser as any)?.childAge} ขวบ)</p>
              )}
              {(currentUser as any)?.experience && (
                <p><strong>ประสบการณ์:</strong> {(currentUser as any)?.experience}</p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold mb-3">สถิติการใช้งาน</h3>
            <div className="space-y-2">
              <p><strong>โควต้าคงเหลือ:</strong> {((currentUser as any)?.quota || 0) - ((currentUser as any)?.usedQuota || 0)}/1,500 บาท</p>
              <p><strong>รายได้รวม:</strong> {(currentUser as any)?.earnings || 0} บาท</p>
              <p><strong>งานที่ทำ:</strong> {((currentUser as any)?.jobHistory?.length || 0)} งาน</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setCurrentUser(null);
              setActiveTab('home');
              showNotification('ออกจากระบบแล้ว');
            }}
            className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            ออกจากระบบ
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบ</p>
          <div className="space-y-2">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              สมัครสมาชิก
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">ฟูมฟัก</h1>
          {/*<p className="text-xs text-gray-500">ดูแลลูกวัยปฐมวัยของพ่อแม่วัยรุ่นที่เป็นเยาวชนนอกระบบการศึกษา</p>*/}
        </div>
        <div className="flex items-center space-x-2">
          {!currentUser ? (
            <>
              <button
                onClick={async () => {
                  const result = await mockAPI.login('parent@example.com', 'password') as any;
                  if (result.success) {
                    setCurrentUser(result.user);
                    showNotification('เข้าสู่ระบบแบบผู้ปกครองสำเร็จ!');
                  }
                }}
                className="bg-pink-500 text-white px-2 py-1 rounded text-xs"
              >
                ผู้ปกครอง
              </button>
              <button
                onClick={async () => {
                  const result = await mockAPI.login('caregiver@example.com', 'password') as any;
                  if (result.success) {
                    setCurrentUser(result.user);
                    showNotification('เข้าสู่ระบบแบบผู้ดูแลสำเร็จ!');
                  }
                }}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs"
              >
                ผู้ดูแล
              </button>
              <button
                onClick={async () => {
                  const result = await mockAPI.login('admin@example.com', 'password') as any;
                  if (result.success) {
                    setCurrentUser(result.user);
                    showNotification('เข้าสู่ระบบแบบแอดมินสำเร็จ!');
                  }
                }}
                className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
              >
                แอดมิน
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="text-blue-500 text-sm"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                สมัครสมาชิก
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm">สวัสดี {(currentUser as any)?.name}</span>
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                {((currentUser as any)?.quota || 0) - ((currentUser as any)?.usedQuota || 0)}฿
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-green-100 text-green-700 p-3 text-center text-sm">
          {notification}
        </div>
      )}

      {/* Main Content */}
      <div className="pb-16">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'points' && <PointsTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t">
        <div className="flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">หน้าหลัก</span>
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'points' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Award className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">แต้ม</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'history' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <History className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">ประวัติ</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 p-3 text-center ${
              activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">โปรไฟล์</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showLogin && <LoginModal />}
      {showRegister && <RegisterModal />}
      {showStoryReader && <StoryReaderModal />}
      {showChildcareTimer && <ChildcareTimerModal />}
      {showQRScanner && <QRScannerModal />}
      {showRatingModal && <RatingModal />}
      {showActivityRecorder && (
        <ActivityRecorder 
          onActivityComplete={handleActivityComplete}
          onClose={() => setShowActivityRecorder(false)}
        />
      )}
    </div>
  );
};

export default FoomFakApp;