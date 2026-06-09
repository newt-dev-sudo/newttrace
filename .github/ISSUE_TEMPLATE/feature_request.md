---
name: Feature Request
description: Suggest an idea for newttrace
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Have an idea? We'd love to hear it.
  - type: textarea
    id: problem
    attributes:
      label: What problem are you trying to solve?
      description: Describe the use case or limitation you ran into.
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: What would you like to see?
      description: Describe the feature or behavior you'd like added.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives
      description: Any workarounds or alternative solutions you've considered.
