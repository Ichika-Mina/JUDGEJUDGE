import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { JudgeChat } from './components/JudgeChat';
import { LayerSimulator } from './components/LayerSimulator';
import { StackVisualizer } from './components/StackVisualizer';
import { RulesBrowser } from './components/RulesBrowser';
import { CardInspector } from './components/CardInspector';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [ruleSearchQuery, setRuleSearchQuery] = useState<string>('');
  const { isOnline, manualOffline, toggleManualOffline, setManualOffline } = useOnlineStatus();

  const handleNavigateToRule = (ruleNumber: string) => {
    setRuleSearchQuery(ruleNumber);
    setActiveTab('rules');
  };

  const handleNavigateToLayer = () => {
    setActiveTab('layers');
  };

  const handleAskAboutCard = (cardName: string) => {
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        manualOffline={manualOffline}
        toggleManualOffline={toggleManualOffline}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'chat' && (
          <JudgeChat
            isOnline={isOnline}
            manualOffline={manualOffline}
            onNavigateToRule={handleNavigateToRule}
            onNavigateToLayer={handleNavigateToLayer}
          />
        )}

        {activeTab === 'layers' && <LayerSimulator />}

        {activeTab === 'stack' && <StackVisualizer />}

        {activeTab === 'rules' && (
          <RulesBrowser initialSearch={ruleSearchQuery} />
        )}

        {activeTab === 'cards' && (
          <CardInspector onAskAboutCard={handleAskAboutCard} />
        )}
      </main>

      {/* Offline Toast Indicator */}
      <OfflineIndicator
        isOnline={isOnline}
        manualOffline={manualOffline}
        onResetManual={() => setManualOffline(false)}
      />
    </div>
  );
};

export default App;
