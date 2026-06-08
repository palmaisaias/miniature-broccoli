// components/AnimatedToast.tsx

type ToastType = "success" | "error" | "info";

type AnimatedToastProps = {
  message: string;
  type?: ToastType;
  phase: "center" | "corner";
};

export default function AnimatedToast({
  message,
  type = "info",
  phase,
}: AnimatedToastProps) {
  return (
    <div className={`animated-toast animated-toast-${type} animated-toast-${phase}`}>
      {message}
    </div>
  );
}