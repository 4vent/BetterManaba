main = () => {
    const scripts = ["DeadlineList.js", "EasyAttendance.js"];
    scripts.forEach(file => {
        const s = document.createElement("script");
        s.src = "https://4vent.github.io/BetterManaba/" + file;
        document.body.appendChild(s);
    });
};

main();