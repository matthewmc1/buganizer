// src/components/Markdown/Markdown.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Link, Typography, Paper } from '@mui/material';

interface MarkdownProps {
  children: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return (
    <ReactMarkdown
      components={{
        h1: (props) => <Typography variant="h4" gutterBottom {...props} />,
        h2: (props) => <Typography variant="h5" gutterBottom {...props} />,
        h3: (props) => <Typography variant="h6" gutterBottom {...props} />,
        h4: (props) => <Typography variant="subtitle1" gutterBottom {...props} />,
        h5: (props) => <Typography variant="subtitle2" gutterBottom {...props} />,
        h6: (props) => <Typography variant="subtitle2" gutterBottom {...props} />,
        p: (props) => <Typography variant="body1" paragraph {...props} />,
        a: (props) => <Link color="primary" {...props} />,
        ul: (props) => <Box component="ul" sx={{ pl: 2 }} {...props} />,
        ol: (props) => <Box component="ol" sx={{ pl: 2 }} {...props} />,
        li: (props) => <Typography component="li" variant="body1" {...props} />,
        code: ({ inline, ...props }: CodeProps) => 
          inline ? (
            <Typography component="code" variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'rgba(0, 0, 0, 0.05)', px: 0.5, borderRadius: 0.5 }} {...props} />
          ) : (
            <Paper variant="outlined" sx={{ p: 1, my: 1, overflow: 'auto' }}>
              <Typography component="pre" variant="body2" sx={{ fontFamily: 'monospace' }} {...props} />
            </Paper>
          ),
        blockquote: (props) => 
          <Paper variant="outlined" sx={{ p: 1, pl: 2, my: 1, borderLeftWidth: 4 }}>
            <Typography component="blockquote" variant="body2" {...props} />
          </Paper>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default Markdown;