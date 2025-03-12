// utils.js - Utility functions for the application

const Utils = (function() {
    // Generate random colors for charts
    function generateColors(count) {
        const predefinedColors = [
            '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
            '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
            '#6b9ac4', '#d7b5a6', '#e58f7c', '#8cd17d', '#b6992d'
        ];

        // Use predefined colors first, then generate random ones if needed
        const colors = [];
        for (let i = 0; i < count; i++) {
            if (i < predefinedColors.length) {
                colors.push(predefinedColors[i]);
            } else {
                const r = Math.floor(Math.random() * 200);
                const g = Math.floor(Math.random() * 200);
                const b = Math.floor(Math.random() * 200);
                colors.push(`rgb(${r}, ${g}, ${b})`);
            }
        }

        return colors;
    }

    // Format date strings
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    // Format numbers with commas (e.g., 1,234)
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Calculate average of an array of numbers
    function calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return sum / numbers.length;
    }

    // Calculate sum of an array of numbers
    function calculateSum(numbers) {
        return numbers.reduce((a, b) => a + b, 0);
    }

    // Deep clone an object
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Check if value is numeric
    function isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    // Truncate text with ellipsis if it's too long
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Get a URL parameter by name
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Return public methods
    return {
        generateColors,
        formatDate,
        formatNumber,
        calculateAverage,
        calculateSum,
        deepClone,
        isNumeric,
        truncateText,
        getUrlParameter
    };
})();
