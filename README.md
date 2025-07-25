# Dusty's Chores 🧹

A PWA chore management app with a grumpy, sarcastic digital butler named Dusty who begrudgingly helps you manage your household tasks.

## 🎭 Who is Dusty?

Dusty is your reluctant digital assistant—a personified AI personality module embedded in the chore app. He's:
- **Passive-aggressive**: "Another chore? You really live on the edge of productivity."
- **Sarcastic**: "Well look at you go. Another one bites the dust."
- **Always watching (but unimpressed)**: "Ah, {name}. The procrastinator returns."

Instead of motivational nudges, Dusty provides emotional dry-cleaning.

## ✨ Features

- **🧼 Chore Assignment**: Add, edit, complete, or delete tasks with assignees and due dates
- **🔔 Smart Grouping**: Chores are grouped by status (Today, Upcoming, Completed, Overdue)
- **✅ Completion Tracking**: Mark tasks done and bask in Dusty's snarky praise
- **👤 User Roles**: Admins can manage all chores; others see their own or unassigned
- **😒 Dusty Personality Engine**: Dynamic responses from Dusty driven by YAML config
- **📱 PWA Support**: Install as a native app on mobile and desktop
- **🔗 Real-time**: (Planned) via Django Channels

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.10+
- pip (Python package manager)
- Django 4.x+
- Django REST Framework

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dusty-chores
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd dusty_backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Run Django migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a Django superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the Django backend**
   ```bash
   python manage.py runserver
   # Backend API at http://localhost:8000
   ```

7. **Start the React frontend**
   ```bash
   npm start
   # Frontend at http://localhost:3000
   ```

8. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development

### Project Structure

```
backend/
├── dusty_backend/         # Django project
│   ├── settings.py        # Django settings
│   └── ...
├── chores/               # Django app for chores, users, achievements
│   ├── models.py         # Django models
│   ├── serializers.py    # DRF serializers
│   ├── views.py          # DRF viewsets
│   └── ...
└── manage.py             # Django management
src/
├── components/           # React components
├── contexts/             # React contexts
├── services/             # Frontend business logic (API, personality, etc.)
├── assets/               # Static assets (YAML, images)
└── types/                # TypeScript interfaces
```

### Key Components

- **DustyBubble**: Animated chat bubble for Dusty's responses
- **ChoreList**: Main interface for viewing and managing chores
- **AuthContext**: Django JWT authentication wrapper
- **dustyPersonality**: YAML-driven personality engine

### Customizing Dusty

Edit `src/assets/dusty-personality.yaml` to customize Dusty's responses:

```yaml
greetings:
  - "Oh, it's you again. What a surprise."
  - "Welcome back, {name}. I suppose you want something."

chore_complete:
  - "Well look at you go. Another one bites the dust."
  - "Congratulations, I guess. Try not to strain yourself."
```

## 🎨 Design Philosophy

- **Dark Theme**: Sophisticated, butler-appropriate color scheme
- **Typography**: Georgia serif font for elegance
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Works on mobile, tablet, and desktop

## 🔧 Configuration

### Django Backend Setup

- Uses Django REST Framework for API endpoints
- JWT authentication for secure login/logout
- Chore, User, Profile, and Achievement models
- CORS enabled for local development

### PWA Configuration

The app is configured as a PWA with:
- Service worker for offline functionality
- App manifest for installation
- Responsive design for mobile use

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Basic functionality without internet

## 🚧 Roadmap

- [ ] Chore creation/editing modal
- [ ] User management and roles
- [ ] Real-time updates (Django Channels)
- [ ] Recurring chore logic
- [ ] Advanced filtering
- [ ] Dark/light theme toggle
- [ ] Dusty avatar customization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for accountability with a touch of humor
- Built with React, TypeScript, and Django REST Framework
- Special thanks to Dusty for his unwavering sarcasm

---

*"Another chore? You really live on the edge of productivity."* - Dusty

## 🔔 Push Notifications

Dusty's Chores supports web push notifications so you never miss a chore assignment or completion alert—even when the app is closed!

### How to Enable Push Notifications

1. **Log in to your account.**
2. Go to your profile or notification settings page.
3. Click the **"Enable Push Notifications"** button.
4. When prompted by your browser, allow notifications for this site.

#### On iOS (iPhone/iPad):
- Open Dusty's Chores in **Safari**.
- Tap the **Share** button and select **"Add to Home Screen"** to install the app as a PWA.
- Open the app from your home screen.
- Go to notification settings and enable push notifications.
- When prompted, allow notifications.

> **Note:** iOS supports push notifications for PWAs on iOS 16.4 and above. You must use the "Add to Home Screen" feature for push to work.

#### On Android:
- Open Dusty's Chores in **Chrome** (or another supported browser).
- You can enable notifications directly in the browser, or install the app as a PWA for the best experience.

### Troubleshooting Tips

- **Not receiving notifications?**
  - Make sure you have enabled notifications in your browser and in the app's notification settings.
  - On iOS, ensure you have added the app to your home screen and are running iOS 16.4 or later.
  - Check your device's system notification settings to ensure notifications are allowed for your browser or PWA.
  - If you denied notification permission, you may need to reset it in your browser settings and try again.
  - Ensure you are logged in and your session is active.
  - Try disabling and re-enabling push notifications in the app.

- **Notifications are delayed or missing?**
  - Some devices and browsers may limit background activity to save battery. Make sure your device allows background notifications for this app.
  - On iOS, notifications may not arrive if the PWA is not launched from the home screen.

- **Still having trouble?**
  - Try logging out and back in, or clearing your browser cache.
  - Contact support or open an issue on GitHub with details about your device and browser.
