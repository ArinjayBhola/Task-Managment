import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, UserCircle2, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";

const WelcomePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decode = jwtDecode(token);
      if (decode.role === "Admin") {
        navigate("/users");
      } else if (decode.role === "User") {
        navigate("/usertasks");
      }
    }
  }, [token, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px]" />
      </div>

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
          TaskMaster
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-blue-200 mb-4">
            <Zap className="w-4 h-4 fill-blue-400 text-blue-400" />
            <span>Manage tasks at lightspeed</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
            Master Your Workflow <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              One Task at a Time.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of task management using our powerful, intuitive, and beautiful interface
            designed for teams and individuals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link to="/admin-signin">
              <Button
                size="lg"
                className="gap-2 group">
                <ShieldCheck className="w-5 h-5 group-hover:text-black transition-colors" />
                Admin Portal
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/user-signin">
              <Button
                variant="outline"
                size="lg"
                className="gap-2">
                <UserCircle2 className="w-5 h-5" />
                User Login
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto w-full px-4">
          {[
            {
              title: "Real-time Tracking",
              icon: "🚀",
              desc: "Monitor your progress in real-time with dynamic dashboards.",
            },
            {
              title: "Team Collaboration",
              icon: "👥",
              desc: "Assign tasks and collaborate with your team seamlessly.",
            },
            { title: "Secure & Reliable", icon: "🔒", desc: "Enterprise-grade security for your data." },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TaskMaster. All rights reserved.
      </footer>
    </div>
  );
};

export default WelcomePage;
