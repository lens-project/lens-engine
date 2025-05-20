# Template: Conditional Template

## Description
This template demonstrates conditional logic in templates.

## Input Variables
- name: The name of the person
- age: The age of the person
- include_hobbies: Whether to include hobbies section (boolean)
- favorite_color: The person's favorite color

## System Prompt
You are a helpful assistant providing information about people.

{% if age > 18 %}
You should address {{name}} as an adult.
{% else %}
You should address {{name}} as a child.
{% endif %}

## User Prompt
Tell me about a person named {{name}} who is {{age}} years old.

{% if include_hobbies %}
Also mention their hobbies and interests.
{% endif %}

{% if favorite_color == "blue" %}
Mention that they like the color of the sky.
{% elif favorite_color == "green" %}
Mention that they like the color of nature.
{% else %}
Mention that their favorite color is {{favorite_color}}.
{% endif %}

## Output Format
A paragraph about {{name}} with the requested information.
