// Imports jest-dom matchers: toBeInTheDocument, toHaveClass, etc.
// This file is automatically picked up by react-scripts test.
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
