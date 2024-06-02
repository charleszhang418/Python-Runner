import React from 'react';
import Editor from '@monaco-editor/react';

function MonacoEditorComponent({ language, theme, value, onChange }) {
  return (
    <Editor
      height="90vh" // or you can use 500 for a fixed height
      defaultLanguage={language}
      defaultValue={value}
      theme={theme}
      onChange={onChange}
      options={{
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: true, // automatically adjust the layout when the container is resized
      }}
    />
  );
}

export default MonacoEditorComponent;
