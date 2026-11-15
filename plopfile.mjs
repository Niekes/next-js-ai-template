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
    description: "signed-in page under src/app/dashboard",
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
    ],
  });
};

export default plopfile;
