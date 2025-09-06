import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';

export default function PullToRefreshWrapper({ onRefresh, refreshing, children, style }) {
  return (
    <ScrollView
      style={style}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
