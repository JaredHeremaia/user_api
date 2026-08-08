export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

// Fields allowed when creating a user
export interface CreateUserInput {
  name: string;
  email: string;
  age?: number;
}

// Fields allowed when updating a user (all optional - partial update)
export interface UpdateUserInput {
  name?: string;
  email?: string;
  age?: number;
}
