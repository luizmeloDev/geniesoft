
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.python3
    pkgs.gcc
    pkgs.nodePackages.npm
    pkgs.nodePackages.nodemon
    pkgs.sqlite
  ];

  env = {};
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {};
    };
  };
}
