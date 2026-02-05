export interface User {
  _id: string;
  information: {
    firstName: string;
    lastName: string;
  };
  credentials: {
    email: string;
  };
  role: 'USER' | 'ADMIN';
  ownedBooks: string[];
}

export interface Book {
  _id: string;
  title: string;
  authorId: string;
  yearPublished: number;
  epub: string;
}

export interface Author {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface FavoriteEntry {
  bookId: string;
  addedAt: string;
}