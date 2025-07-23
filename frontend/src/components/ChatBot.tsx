import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';

type Message = {
  from: 'user' | 'bot';
  text: string;
  timestamp: Date;
};

type UserData = {
  exercise_name?: string;
  [key: string]: any;
};

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      from: 'bot', 
      text: "💬 Hi! I'm your AI fitness assistant. Let's put together your personalized fitness plan! Ask me about exercises, goals, or anything fitness-related.", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [userData, setUserData] = useState<UserData>({});
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newUserMsg = { role: 'user', content: userMessage };
    
    // Add user message to UI
    setMessages(prev => [...prev, { 
      from: 'user', 
      text: userMessage, 
      timestamp: new Date() 
    }]);
    
    setInput('');
    setIsLoading(true);
    setError('');
    
    const updatedHistory = [...history, newUserMsg];
    setHistory(updatedHistory);

    try {
      const response = await fetch('http://localhost:5000/start_chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          flow: 'fitness',
          message: userMessage,
          history: updatedHistory,
          user_data: userData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Add bot response to UI
      setMessages(prev => [...prev, { 
        from: 'bot', 
        text: result.reply || 'Sorry, I didn\'t understand that. Can you try rephrasing?', 
        timestamp: new Date() 
      }]);
      
      if (result.user_data) {
        setUserData(result.user_data);
      }
      
      setHistory([...updatedHistory, { role: 'assistant', content: result.reply }]);

    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to connect to chat service. Please try again.');
      setMessages(prev => [...prev, { 
        from: 'bot', 
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessIcon />
          <Typography variant="h5" component="h1">
            AI Fitness Assistant
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          Get personalized fitness advice and exercise recommendations
        </Typography>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Messages */}
      <Paper 
        elevation={1} 
        sx={{ 
          flex: 1, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          mb: 2
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          <List>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    flexDirection: message.from === 'user' ? 'row-reverse' : 'row',
                    textAlign: message.from === 'user' ? 'right' : 'left'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: message.from === 'user' ? 'primary.main' : 'secondary.main',
                        ml: message.from === 'user' ? 1 : 0,
                        mr: message.from === 'user' ? 0 : 1
                      }}
                    >
                      {message.from === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          bgcolor: message.from === 'user' ? 'primary.light' : 'grey.100',
                          color: message.from === 'user' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          maxWidth: '70%',
                          ml: message.from === 'user' ? 'auto' : 0,
                          mr: message.from === 'user' ? 0 : 'auto'
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            mt: 1, 
                            opacity: 0.7,
                            fontSize: '0.75rem'
                          }}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    }
                  />
                </ListItem>
                {index < messages.length - 1 && <Divider variant="middle" />}
              </React.Fragment>
            ))}
            {isLoading && (
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <BotIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>
      </Paper>

      {/* Input */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask me about exercises, fitness goals, or get personalized recommendations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatBot;
