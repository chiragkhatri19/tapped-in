```markdown
# tapped-in Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `tapped-in` TypeScript codebase. It covers file naming, import/export styles, commit message formatting, and testing patterns. By following these guidelines, contributors can ensure consistency and maintainability throughout the project.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example:  
    ```
    user-profile.ts
    data-service.test.ts
    ```

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { UserService } from '@services/user-service';
    ```

### Export Style
- Use **named exports** exclusively.
  - Example:
    ```typescript
    // In user-profile.ts
    export const UserProfile = () => { /* ... */ };
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `feat` prefix for new features.
  - Example:
    ```
    feat: add user authentication flow
    ```

## Workflows

### Feature Development
**Trigger:** When starting a new feature  
**Command:** `/feature-dev`

1. Create a new branch for your feature.
2. Use kebab-case for any new files.
3. Use alias imports and named exports in your code.
4. Write a conventional commit message with the `feat` prefix.
5. Open a pull request for review.

### Testing
**Trigger:** When writing or running tests  
**Command:** `/run-tests`

1. Place test files alongside source files, using the `*.test.*` pattern.
   - Example:  
     ```
     user-profile.test.ts
     ```
2. Write tests using the project's preferred (unspecified) testing framework.
3. Run the test suite to ensure all tests pass.

## Testing Patterns

- Test files use the `*.test.*` naming pattern.
- Place test files next to the code they test.
- Example test file:
  ```typescript
  // user-profile.test.ts
  import { UserProfile } from './user-profile';

  describe('UserProfile', () => {
    it('should render correctly', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /feature-dev   | Start a new feature development workflow      |
| /run-tests     | Run the test suite                           |
```
