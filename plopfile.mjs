const plopfile = (plop) => {
  plop.setGenerator("component", {
    description: "app-* wrapper component in src/components",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name (kebab-case, without the app- prefix):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/components/app-{{kebabCase name}}.tsx",
        templateFile: "plop-templates/component/app-component.hbs",
      },
      {
        type: "add",
        path: "src/components/app-{{kebabCase name}}.test.tsx",
        templateFile: "plop-templates/component/app-component.test.hbs",
      },
    ],
  });

  plop.setGenerator("feature", {
    description: "feature folder under src/features with a signed-in page under src/app/dashboard",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case, becomes the route segment):",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/app/dashboard/{{kebabCase name}}/page.tsx",
        templateFile: "plop-templates/feature/page.hbs",
      },
      {
        type: "add",
        path: "src/app/dashboard/{{kebabCase name}}/page.test.tsx",
        templateFile: "plop-templates/feature/page.test.hbs",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/components/{{kebabCase name}}-panel.tsx",
        templateFile: "plop-templates/feature/panel.hbs",
      },
      {
        type: "add",
        path: "src/features/{{kebabCase name}}/components/{{kebabCase name}}-panel.test.tsx",
        templateFile: "plop-templates/feature/panel.test.hbs",
      },
    ],
  });
};

export default plopfile;
