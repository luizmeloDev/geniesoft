
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.python3
    pkgs.gcc
    pkgs.nodePackages.npm
    pkgs.nodePackages.nodemon
  ];

  env = {};
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm", "run", "dev"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {};
    };
  };
}
