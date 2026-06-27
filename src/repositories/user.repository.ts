import { User } from "../types/user.type";

export const users: User[] = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Michael Johnson", email: "michael.johnson@example.com" },
  { id: "4", name: "Emily Davis", email: "emily.davis@example.com" },
  { id: "5", name: "William Brown", email: "william.brown@example.com" },
];

export const findAll = (): User[] => {
  return users;
};

export const findById = (id: string): User | undefined => {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      return users[i];
    }
  }

  return undefined;
};

export const findByName = (name: string): User[] => {
  const resultUsers: User[] = [];
  for (let i = 0; i < users.length; i++) {
    const userLower = users[i].name.toLocaleLowerCase();
    if (userLower.includes(name.toLocaleLowerCase())) {
      resultUsers.push(users[i]);
    }
  }

  return resultUsers;
};

export const createUser = (user: User) => {
  users.push(user);
};

export const deleteUser = (id: string) => {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      users.splice(i, 1);
      return true;
    }
  }
  return false;
};
